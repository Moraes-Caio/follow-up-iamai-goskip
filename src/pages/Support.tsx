import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { HelpCircle, Mail, Copy } from 'lucide-react';

const whatsappSvg = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#25D366" className="h-7 w-7">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const faqData = [
  {
    category: 'Como Começar',
    items: [
      { q: 'Como adiciono meu primeiro paciente?', a: 'Acesse Pacientes no menu lateral, clique em "+ Novo Paciente", preencha os dados e salve. Se o paciente for menor de 18 anos, recomendamos adicionar um responsável.' },
      { q: 'Como conecto o WhatsApp?', a: 'Vá em Configurações > WhatsApp, configure o servidor e token da UAZAPI e aguarde a confirmação de conexão.' },
      { q: 'Como criar meu primeiro lembrete?', a: 'Acesse Lembretes > + Novo Lembrete, escolha o tipo (Retorno Periódico ou Confirmação de Consulta), configure o intervalo e personalize a mensagem.' },
    ],
  },
  {
    category: 'Gerenciar Pacientes',
    items: [
      { q: 'Como adicionar um responsável?', a: 'Ao criar ou editar um paciente, ative o toggle "Tem responsável?", preencha nome, relação e telefone do responsável.' },
      { q: 'Posso ter mais de um responsável por paciente?', a: 'No momento, o sistema suporta apenas um responsável por paciente.' },
      { q: 'Para quem são enviadas as mensagens?', a: 'As mensagens são enviadas para o telefone do responsável (se cadastrado), caso contrário para o telefone do próprio paciente.' },
    ],
  },
  {
    category: 'Consultas e Agendamentos',
    items: [
      { q: 'Como agendar uma consulta?', a: 'Vá em Consultas, clique em um dia no calendário, defina horário, procedimento e profissional responsável.' },
      { q: 'A confirmação é enviada automaticamente?', a: 'Sim, se você tiver um template de confirmação de consulta ativo, a mensagem será enviada automaticamente conforme os dias configurados antes da consulta.' },
      { q: 'Como cancelo uma consulta?', a: 'Abra os detalhes da consulta e altere o status para "Cancelada". O paciente NÃO receberá notificação automática do cancelamento.' },
    ],
  },
  {
    category: 'Mensagens e Lembretes',
    items: [
      { q: 'Posso personalizar as mensagens?', a: 'Sim! Em Lembretes, edite o template e use variáveis como {nome_paciente}, {nome_responsavel}, {data}, {horario}, {procedimento}, {idade}, {clinica}.' },
      { q: 'O que significam os ícones de status?', a: '✓ = Enviada | ✓✓ cinza = Entregue | ✓✓ azul = Lida | X vermelho = Falha no envio.' },
      { q: 'O que é o botão "Melhorar com IA"?', a: 'Ao editar um template de lembrete, clique em "Melhorar com IA" e a inteligência artificial sugerirá melhorias na linguagem da sua mensagem automaticamente.' },
      { q: 'Como funciona o retorno periódico?', a: 'Você define um procedimento, o intervalo de retorno e a data do último procedimento. O sistema calcula automaticamente a próxima data e envia o lembrete com antecedência configurável.' },
    ],
  },
  {
    category: 'Equipe e Permissões',
    items: [
      { q: 'Quais são os papéis disponíveis?', a: 'Você pode criar papéis personalizados com permissões específicas para cada funcionalidade do sistema (pacientes, consultas, lembretes, mensagens, equipe, configurações).' },
      { q: 'Posso desativar um membro da equipe?', a: 'Sim, na página de Equipe, clique no botão de ativar/desativar do membro. Membros desativados perdem acesso ao sistema.' },
    ],
  },
];

const copyToClipboard = (text: string, label: string) => {
  navigator.clipboard.writeText(text).then(() => {
    toast({ title: 'Copiado!', description: `${label} copiado para a área de transferência.` });
  });
};

export default function Support() {
  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Central de Suporte</h1>
        <p className="text-muted-foreground mt-1">Tire suas dúvidas ou entre em contato conosco</p>
      </div>

      {/* Contact cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {/* WhatsApp */}
        <Card className="hover:shadow-md transition-shadow duration-300">
          <CardContent className="p-6 flex flex-col items-center text-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
              {whatsappSvg}
            </div>
            <p className="text-sm font-medium text-foreground">WhatsApp Suporte</p>
            <button
              onClick={() => copyToClipboard('+55 11 95213-8636', 'Número')}
              className="text-sm text-primary hover:underline inline-flex items-center gap-1.5 transition-colors"
            >
              +55 11 95213-8636
              <Copy className="h-3.5 w-3.5" />
            </button>
            <Button size="sm" variant="outline" className="w-full mt-1" asChild>
              <a href="https://wa.me/5511952138636" target="_blank" rel="noopener noreferrer">Abrir WhatsApp</a>
            </Button>
          </CardContent>
        </Card>

        {/* Email */}
        <Card className="hover:shadow-md transition-shadow duration-300">
          <CardContent className="p-6 flex flex-col items-center text-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-7 w-7 text-primary" strokeWidth={2} />
            </div>
            <p className="text-sm font-medium text-foreground">Envie um Email</p>
            <button
              onClick={() => copyToClipboard('contato@iamai.ia.br', 'Email')}
              className="text-sm text-primary hover:underline inline-flex items-center gap-1.5 transition-colors"
            >
              contato@iamai.ia.br
              <Copy className="h-3.5 w-3.5" />
            </button>
          </CardContent>
        </Card>
      </div>

      {/* FAQ */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <HelpCircle className="h-5 w-5 text-primary" strokeWidth={2} />
            </div>
            <CardTitle className="text-lg">Perguntas Frequentes</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {faqData.map((cat, ci) => (
              <div key={ci} className="mb-4 last:mb-0">
                <p className="text-sm font-semibold text-foreground mb-2">{cat.category}</p>
                {cat.items.map((item, ii) => (
                  <AccordionItem key={`${ci}-${ii}`} value={`${ci}-${ii}`} className="border-b border-border">
                    <AccordionTrigger className="text-sm font-medium hover:bg-muted/50 px-4 py-3 rounded-lg">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="px-4 text-sm text-muted-foreground leading-relaxed">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </div>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
