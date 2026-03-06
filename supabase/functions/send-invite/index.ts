import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { invitationId, email, token, invitedByName } = await req.json()

    if (!email || !token) {
      return new Response(
        JSON.stringify({ error: 'email and token are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const webhookUrl = Deno.env.get('N8N_INVITE_WEBHOOK_URL')
    if (!webhookUrl) {
      return new Response(
        JSON.stringify({ error: 'N8N_INVITE_WEBHOOK_URL not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const origin = req.headers.get('origin') || 'https://app.example.com'
    const inviteUrl = `${origin}/login?invite=${token}`

    const n8nRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invitation_id: invitationId,
        email,
        token,
        invited_by_name: invitedByName || '',
        invite_url: inviteUrl,
      }),
    })

    if (!n8nRes.ok) {
      const errBody = await n8nRes.text().catch(() => 'Unknown error')
      console.error('n8n webhook error:', n8nRes.status, errBody)
      return new Response(
        JSON.stringify({ error: 'Failed to send invite via n8n', details: errBody }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Invite sent successfully to ${email} via n8n webhook`)

    return new Response(
      JSON.stringify({ success: true, inviteUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in send-invite:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
