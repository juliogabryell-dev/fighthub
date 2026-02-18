export const metadata = {
  title: 'Privacidade | FightHub',
};

const sections = [
  {
    title: '1. Informacoes que Coletamos',
    content:
      'Coletamos informacoes que voce fornece diretamente ao se cadastrar na plataforma, incluindo: nome completo, data de nascimento, email, CPF e RG (opcionais), tipo de perfil (lutador ou treinador), e informacoes sobre sua pratica em artes marciais. Tambem coletamos automaticamente dados de uso, como paginas acessadas e horarios de acesso.',
  },
  {
    title: '2. Como Utilizamos suas Informacoes',
    content:
      'Suas informacoes sao utilizadas para: criar e gerenciar sua conta; exibir seu perfil publico na plataforma; verificar carteis de luta; enviar notificacoes sobre a plataforma; melhorar nossos servicos; e garantir a seguranca da comunidade. Nao vendemos suas informacoes pessoais a terceiros.',
  },
  {
    title: '3. Compartilhamento de Dados',
    content:
      'Informacoes do seu perfil publico (nome, arte marcial, cartel) sao visiveis para outros usuarios da plataforma. Informacoes sensiveis como CPF e RG sao acessiveis apenas pela equipe administrativa para fins de verificacao. Podemos compartilhar dados agregados e anonimizados para fins estatisticos.',
  },
  {
    title: '4. Armazenamento e Seguranca',
    content:
      'Seus dados sao armazenados em servidores seguros fornecidos pela Supabase, com criptografia em transito e em repouso. Implementamos medidas de seguranca tecnicas e organizacionais para proteger suas informacoes contra acesso nao autorizado, alteracao ou destruicao. Senhas sao armazenadas com hash criptografico e nunca em texto puro.',
  },
  {
    title: '5. Seus Direitos',
    content:
      'De acordo com a Lei Geral de Protecao de Dados (LGPD), voce tem direito a: acessar seus dados pessoais; corrigir dados incompletos ou desatualizados; solicitar a exclusao de seus dados; revogar o consentimento para o tratamento de dados; e solicitar a portabilidade dos seus dados. Para exercer esses direitos, entre em contato conosco.',
  },
  {
    title: '6. Cookies',
    content:
      'Utilizamos cookies essenciais para o funcionamento da plataforma, incluindo cookies de autenticacao para manter sua sessao ativa. Nao utilizamos cookies de rastreamento publicitario. Ao utilizar a plataforma, voce consente com o uso de cookies essenciais.',
  },
  {
    title: '7. Menores de Idade',
    content:
      'O FightHub nao e destinado a menores de 16 anos sem o consentimento de um responsavel legal. Se tomarmos conhecimento de que coletamos dados de um menor sem o devido consentimento, tomaremos medidas para remover essas informacoes.',
  },
  {
    title: '8. Alteracoes nesta Politica',
    content:
      'Esta Politica de Privacidade pode ser atualizada periodicamente. Notificaremos os usuarios sobre mudancas significativas atraves da plataforma. Recomendamos a revisao periodica desta pagina para se manter informado sobre como protegemos seus dados.',
  },
  {
    title: '9. Contato do Encarregado de Dados',
    content:
      'Para questoes relacionadas a privacidade e protecao de dados, entre em contato com nosso encarregado de dados (DPO) atraves do email privacidade@fighthub.com.br ou pela pagina de Contato da plataforma.',
  },
];

export default function PrivacidadePage() {
  return (
    <main className="min-h-screen px-6 py-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="font-bebas text-5xl text-white tracking-wider">
          POLITICA DE <span className="text-brand-red">PRIVACIDADE</span>
        </h1>
        <p className="font-barlow text-white/50 mt-3 text-lg">
          Ultima atualizacao: Fevereiro de 2026
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {sections.map((section) => (
          <div
            key={section.title}
            className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl border border-white/10 p-6"
          >
            <h2 className="font-bebas text-lg text-brand-gold tracking-wider mb-3">
              {section.title}
            </h2>
            <p className="font-barlow text-sm text-white/50 leading-relaxed">
              {section.content}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
