export default function PrivacidadePage() {
  return (
    <div className="prose prose-sm max-w-2xl mx-auto p-6">
      <h1 className="font-serif">Política de Privacidade</h1>
      <p className="text-muted-foreground">Última atualização: {new Date().getFullYear()}</p>

      <h2 className="font-serif">1. Dados coletados</h2>
      <p>Coletamos nome, e-mail, telefone e fotos de comprovantes de pagamento para gerenciar seus agendamentos.</p>

      <h2 className="font-serif">2. Uso dos dados</h2>
      <p>Seus dados são usados exclusivamente para: agendamento de serviços, comunicação sobre seus atendimentos, e registro de histórico.</p>

      <h2 className="font-serif">3. Armazenamento</h2>
      <p>Seus dados são armazenados de forma segura. Comprovantes de pagamento são visíveis apenas para você e para a manicure.</p>

      <h2 className="font-serif">4. Seus direitos</h2>
      <p>Você pode solicitar a exclusão de seus dados a qualquer momento entrando em contato.</p>
    </div>
  )
}
