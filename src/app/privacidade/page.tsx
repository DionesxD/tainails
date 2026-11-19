import { ShieldCheck } from 'lucide-react'
import { LegalPage } from '@/components/legal-page'

export const metadata = {
  title: 'Política de Privacidade — Tainails',
  description: 'Política de privacidade da plataforma de agendamentos Tainails.',
}

export default function PrivacidadePage() {
  return (
    <LegalPage
      icon={ShieldCheck}
      eyebrow="Seus dados, bem cuidados"
      title="Política de Privacidade"
      updatedAt={new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
      intro="Sua privacidade é levada a sério aqui. Esta política explica, de forma simples e direta, quais dados a plataforma utiliza e como eles protegem a sua experiência com a Tainails."
      sections={[
        {
          title: 'Dados coletados',
          body: 'Coletamos nome, e-mail, telefone e fotos de comprovantes de pagamento para gerenciar seus agendamentos.',
        },
        {
          title: 'Uso dos dados',
          body: 'Seus dados são usados exclusivamente para: agendamento de serviços, comunicação sobre seus atendimentos e registro de histórico.',
        },
        {
          title: 'Armazenamento',
          body: 'Seus dados são armazenados de forma segura. Comprovantes de pagamento são visíveis apenas para você e para a manicure.',
        },
        {
          title: 'Seus direitos',
          body: 'Você pode solicitar a exclusão de seus dados a qualquer momento entrando em contato.',
        },
      ]}
      footerNote="Quer revisar ou excluir seus dados? Basta pedir — seus direitos vêm sempre em primeiro lugar."
      prev={{ href: '/termos', label: 'Termos de Uso' }}
    />
  )
}
