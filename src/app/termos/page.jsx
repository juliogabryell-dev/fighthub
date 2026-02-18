export const metadata = {
  title: 'Termos de Uso | FightHub',
};

const sections = [
  {
    title: '1. Aceitacao dos Termos',
    content:
      'Ao acessar e utilizar a plataforma FightHub, voce concorda com estes Termos de Uso. Se voce nao concordar com qualquer parte destes termos, nao devera utilizar nossos servicos. O uso continuado da plataforma constitui aceitacao de quaisquer alteracoes futuras nestes termos.',
  },
  {
    title: '2. Descricao do Servico',
    content:
      'O FightHub e uma plataforma online que conecta praticantes de artes marciais, incluindo lutadores e treinadores. Nossos servicos incluem: cadastro de perfis, registro de carteis de luta, publicacao de noticias sobre artes marciais, e ferramentas de conexao entre membros da comunidade.',
  },
  {
    title: '3. Cadastro e Conta',
    content:
      'Para utilizar determinados recursos da plataforma, voce devera criar uma conta fornecendo informacoes verdadeiras e atualizadas. Voce e responsavel por manter a confidencialidade de sua senha e por todas as atividades realizadas em sua conta. Contas com informacoes falsas poderao ser suspensas ou removidas.',
  },
  {
    title: '4. Conduta do Usuario',
    content:
      'Ao utilizar o FightHub, voce se compromete a: nao publicar conteudo ofensivo, difamatorio ou ilegal; nao utilizar a plataforma para promover violencia fora do contexto esportivo; respeitar outros membros da comunidade; nao tentar acessar areas restritas da plataforma; e nao utilizar bots ou scripts automatizados.',
  },
  {
    title: '5. Conteudo do Usuario',
    content:
      'Voce mantem a propriedade do conteudo que publica na plataforma. Ao publicar conteudo, voce concede ao FightHub uma licenca nao exclusiva para exibir, distribuir e promover esse conteudo dentro da plataforma. O FightHub reserva-se o direito de remover conteudo que viole estes termos.',
  },
  {
    title: '6. Verificacao de Carteis',
    content:
      'Os carteis de luta registrados na plataforma passam por um processo de verificacao pela equipe administrativa. O FightHub nao garante a precisao absoluta das informacoes fornecidas pelos usuarios, mas se esforsa para manter a integridade dos dados atraves de verificacoes periodicas.',
  },
  {
    title: '7. Limitacao de Responsabilidade',
    content:
      'O FightHub e fornecido "como esta". Nao nos responsabilizamos por danos diretos ou indiretos resultantes do uso da plataforma. Nao garantimos disponibilidade ininterrupta do servico. As informacoes sobre artes marciais sao de carater informativo e nao substituem orientacao profissional.',
  },
  {
    title: '8. Modificacoes',
    content:
      'O FightHub reserva-se o direito de modificar estes Termos de Uso a qualquer momento. As alteracoes serao publicadas nesta pagina com a data de atualizacao. O uso continuado da plataforma apos as alteracoes constitui aceitacao dos novos termos.',
  },
  {
    title: '9. Contato',
    content:
      'Para duvidas sobre estes Termos de Uso, entre em contato atraves do email contato@fighthub.com.br ou pela pagina de Contato da plataforma.',
  },
];

export default function TermosPage() {
  return (
    <main className="min-h-screen px-6 py-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="font-bebas text-5xl text-white tracking-wider">
          TERMOS DE <span className="text-brand-red">USO</span>
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
