import { ScrollText } from 'lucide-react'
import { LegalPage } from '@/components/legal-page'

export const metadata = {
  title: 'Termos de Uso — Tainails',
  description: 'Termos de uso da plataforma de agendamentos Tainails.',
}

export default function TermosPage() {
  return (
    <LegalPage
      icon={ScrollText}
      eyebrow="Acordo de utilização"
      title="Termos de Uso"
      updatedAt={new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
      intro="Bem-vinda à Tainails! Estes termos organizam a utilização da nossa plataforma de agendamentos para que a experiência seja tranquila, justa e transparente para você e para o studio."
      sections={[
        {
          title: 'Sobre a plataforma',
          body: 'Esta plataforma é destinada ao agendamento de serviços de nail design prestados por Tainails. Ao utilizá-la, você concorda com estes termos.',
        },
        {
          title: 'Agendamentos e sinal',
          body: 'Todo agendamento exige pagamento de 50% do valor do procedimento como sinal via Pix. O horário só é confirmado após o envio e a aprovação do comprovante de pagamento.',
        },
        {
          title: 'Cancelamento e não comparecimento',
          body: 'Em caso de não comparecimento ou atraso superior a 15 minutos sem aviso prévio, o sinal não é devolvido. Cancelamento gratuito até 4 horas antes do horário agendado.',
        },
        {
          title: 'Reposição de unha',
          body: 'Reposição de unha quebrada: R$ 10,00. O pagamento restante deve ser feito no atendimento.',
        },
        {
          title: 'Privacidade',
          body: 'Seus dados são utilizados apenas para gerenciar seus agendamentos. Não compartilhamos suas informações com terceiros.',
        },
      ]}
      footerNote="Dúvidas sobre estes termos? Fale diretamente com a Tainails pelo WhatsApp da plataforma — respondemos rapidinho."
      next={{ href: '/privacidade', label: 'Política de Privacidade' }}
    />
  )
}
