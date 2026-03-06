import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate JWT and extract user identity
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token)
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const profileId = claimsData.claims.sub as string

    // Service role client for operations that need it (e.g., reading api_credentials)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    // ===== APPOINTMENTS =====

    if (action === 'get-pending-reminders') {
      const daysAhead = parseInt(url.searchParams.get('days_ahead') || '3')
      if (isNaN(daysAhead) || daysAhead < 0 || daysAhead > 90) {
        return new Response(JSON.stringify({ error: 'Invalid days_ahead (0-90)' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const today = new Date()
      const futureDate = new Date(today)
      futureDate.setDate(futureDate.getDate() + daysAhead)

      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          id, date, time, procedure_name, status, profile_id, patient_id, lembrete_mensagem,
          patients!appointments_patient_id_fkey (
            full_name, phone, has_responsible, responsible_name, responsible_phone
          ),
          profiles!appointments_profile_id_fkey (
            nome_clinica
          )
        `)
        .eq('profile_id', profileId)
        .eq('lembrete_enviado', false)
        .eq('status', 'pending')
        .gte('date', today.toISOString().split('T')[0])
        .lte('date', futureDate.toISOString().split('T')[0])

      if (error) throw error

      // Fetch API credentials from profiles table
      const { data: creds } = await supabase
        .from('profiles')
        .select('uazapi_server, uazapi_token')
        .eq('id', profileId)
        .maybeSingle()

      const reminders = (appointments || []).map((apt: any) => {
        const patient = apt.patients
        const profile = apt.profiles
        const recipientPhone = patient?.has_responsible && patient?.responsible_phone
          ? patient.responsible_phone
          : patient?.phone
        const recipientName = patient?.has_responsible && patient?.responsible_name
          ? patient.responsible_name
          : patient?.full_name

        return {
          appointment_id: apt.id,
          profile_id: apt.profile_id,
          patient_name: patient?.full_name,
          recipient_name: recipientName,
          recipient_phone: recipientPhone,
          date: apt.date,
          time: apt.time,
          procedure_name: apt.procedure_name,
          clinic_name: profile?.nome_clinica,
          uazapi_server: creds?.uazapi_server,
          uazapi_token: creds?.uazapi_token,
          custom_message: apt.lembrete_mensagem,
        }
      })

      return new Response(JSON.stringify({ reminders }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'record-sent-message') {
      const body = await req.json()
      const { appointment_id } = body

      if (!appointment_id || typeof appointment_id !== 'string') {
        return new Response(JSON.stringify({ error: 'Valid appointment_id required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Verify ownership before updating
      const { data: apt } = await supabase
        .from('appointments')
        .select('id')
        .eq('id', appointment_id)
        .eq('profile_id', profileId)
        .maybeSingle()

      if (!apt) {
        return new Response(JSON.stringify({ error: 'Appointment not found or access denied' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { error } = await supabase
        .from('appointments')
        .update({
          lembrete_enviado: true,
          lembrete_enviado_em: new Date().toISOString(),
        })
        .eq('id', appointment_id)
        .eq('profile_id', profileId)

      if (error) throw error

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'ai-message') {
      const body = await req.json()
      const { acao, tipo_lembrete, procedimento, informacoes_procedimento, variaveis_disponiveis, mensagem_atual } = body

      if (!acao || !['gerar', 'melhorar'].includes(acao)) {
        return new Response(JSON.stringify({ error: 'acao must be "gerar" or "melhorar"' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const webhookUrl = Deno.env.get('N8N_WEBHOOK_URL')
      if (!webhookUrl) {
        return new Response(JSON.stringify({ error: 'N8N webhook not configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const payload: Record<string, unknown> = {
        acao,
        tipo_lembrete: tipo_lembrete || '',
        procedimento: procedimento || '',
        informacoes_procedimento: informacoes_procedimento || null,
        variaveis_disponiveis: variaveis_disponiveis || [],
      }
      if (acao === 'melhorar' && mensagem_atual) {
        payload.mensagem_atual = mensagem_atual
      }

      const n8nRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const n8nData = await n8nRes.json()

      // n8n returns { output: "message text" } — normalize to { mensagem: "..." }
      let mensagem = ''
      if (typeof n8nData === 'string') {
        mensagem = n8nData
      } else if (n8nData?.output) {
        mensagem = String(n8nData.output)
      } else if (n8nData?.mensagem) {
        mensagem = String(n8nData.mensagem)
      } else if (Array.isArray(n8nData) && n8nData[0]?.output) {
        mensagem = String(n8nData[0].output)
      }

      // Normalize n8n escaped newlines to actual newlines
      mensagem = mensagem.replace(/\\n/g, '\n')

      return new Response(JSON.stringify({ mensagem }), {
        status: n8nRes.ok ? 200 : 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'improve-message') {
      const body = await req.json()
      const { text } = body

      if (!text || typeof text !== 'string' || text.length > 5000) {
        return new Response(JSON.stringify({ error: 'Valid text required (max 5000 chars)' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const improvedText = text
        .replace(/Olá/g, 'Olá! 👋')
        .replace(/\n\n/g, '\n\n✨ ')
        + '\n\n💚 Cuidamos de você com carinho!'

      return new Response(JSON.stringify({ improved_text: improvedText }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ===== PATIENT RETURNS =====

    if (action === 'get-pending-returns') {
      const today = new Date().toISOString().split('T')[0]

      const { data: returns, error } = await supabase
        .from('patient_returns')
        .select(`
          id, profile_id, patient_id, procedure_id, last_procedure_date,
          return_interval_days, reminder_send_date, status, lembrete_mensagem,
          patients!patient_returns_patient_id_fkey (
            full_name, phone, has_responsible, responsible_name, responsible_phone
          ),
          procedures!patient_returns_procedure_id_fkey ( title ),
          profiles:profile_id ( nome_clinica )
        `)
        .eq('profile_id', profileId)
        .eq('lembrete_enviado', false)
        .eq('status', 'pendente')
        .lte('reminder_send_date', today)

      if (error) throw error

      // Fetch API credentials from profiles table
      const { data: creds } = await supabase
        .from('profiles')
        .select('uazapi_server, uazapi_token')
        .eq('id', profileId)
        .maybeSingle()

      const pendingReturns = (returns || []).map((r: any) => {
        const patient = r.patients
        const recipientPhone = patient?.has_responsible && patient?.responsible_phone
          ? patient.responsible_phone
          : patient?.phone
        const recipientName = patient?.has_responsible && patient?.responsible_name
          ? patient.responsible_name
          : patient?.full_name

        return {
          return_id: r.id,
          profile_id: r.profile_id,
          patient_name: patient?.full_name,
          recipient_name: recipientName,
          recipient_phone: recipientPhone,
          procedure_name: r.procedures?.title,
          last_procedure_date: r.last_procedure_date,
          reminder_send_date: r.reminder_send_date,
          return_interval_days: r.return_interval_days,
          clinic_name: r.profiles?.nome_clinica,
          uazapi_server: creds?.uazapi_server,
          uazapi_token: creds?.uazapi_token,
          custom_message: r.lembrete_mensagem,
        }
      })

      return new Response(JSON.stringify({ returns: pendingReturns }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'record-return-sent') {
      const body = await req.json()
      const { return_id, message } = body

      if (!return_id || typeof return_id !== 'string') {
        return new Response(JSON.stringify({ error: 'Valid return_id required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Verify ownership
      const { data: ret } = await supabase
        .from('patient_returns')
        .select('id')
        .eq('id', return_id)
        .eq('profile_id', profileId)
        .maybeSingle()

      if (!ret) {
        return new Response(JSON.stringify({ error: 'Return not found or access denied' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { error } = await supabase
        .from('patient_returns')
        .update({
          lembrete_enviado: true,
          lembrete_enviado_em: new Date().toISOString(),
          lembrete_mensagem: typeof message === 'string' ? message.slice(0, 5000) : null,
          status: 'enviado',
        })
        .eq('id', return_id)
        .eq('profile_id', profileId)

      if (error) throw error

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
