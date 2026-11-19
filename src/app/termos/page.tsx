export default function TermosPage() {
  return (
    <div className="prose prose-sm max-w-2xl mx-auto p-6">
      <h1 className="font-serif">Termos de Uso</h1>
      <p className="text-muted-foreground">Última atualização: {new Date().getFullYear()}</p>

      <h2 className="font-serif">1. Sobre a plataforma</h2>
      <p>Esta plataforma é destinada ao agendamento de serviços de nail design prestados por Tainails. Ao utilizar a plataforma, você concorda com estes termos.</p>

      <h2 className="font-serif">2. Agendamentos e sinal</h2>
      <p>Todo agendamento exige pagamento de 50% do valor do procedimento como sinal via Pix. O horário só é confirmado após o envio e aprovação do comprovante de pagamento.</p>

      <h2 className="font-serif">3. Cancelamento e não comparecimento</h2>
      <p>Em caso de não comparecimento ou atraso superior a 15 minutos sem aviso prévio, o sinal não é devolvido. Cancelamento gratuito até 4 horas antes do horário agendado.</p>

      <h2 className="font-serif">4. Reposição de unha</h2>
      <p>Reposição de unha quebrada: R$ 10,00. O pagamento restante deve ser feito no atendimento.</p>

      <h2 className="font-serif">5. Privacidade</h2>
      <p>Seus dados são utilizados apenas para gerenciar seus agendamentos. Não compartilhamos suas informações com terceiros.</p>
    </div>
  )
}
