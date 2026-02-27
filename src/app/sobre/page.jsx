import Icon from '@/components/Icon';

export const metadata = {
  title: 'Sobre | FightLog',
};

const values = [
  {
    icon: 'swords',
    title: 'Paixão pelas Lutas',
    description:
      'Nascemos do amor pelas modalidades e da vontade de criar um espaço dedicado a todos que compartilham essa paixão.',
  },
  {
    icon: 'users',
    title: 'Comunidade',
    description:
      'Conectamos lutadores, treinadores e entusiastas em uma plataforma que fortalece laços e cria oportunidades.',
  },
  {
    icon: 'shield',
    title: 'Transparência',
    description:
      'Cartéis verificados, perfis autênticos e informações confiáveis para toda a comunidade marcial.',
  },
  {
    icon: 'globe',
    title: 'Acessibilidade',
    description:
      'Uma plataforma gratuita e aberta para praticantes de todas as modalidades e níveis de experiência.',
  },
];

export default function SobrePage() {
  return (
    <main className="min-h-screen px-6 py-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="font-bebas text-5xl text-theme-text tracking-wider">
          SOBRE O <span className="text-brand-red">FIGHTLOG</span>
        </h1>
        <p className="font-barlow text-theme-text/50 mt-3 text-lg max-w-2xl mx-auto">
          A plataforma que conecta o mundo das modalidades
        </p>
      </div>

      {/* What is FightLog */}
      <div className="bg-gradient-to-br from-dark-card to-dark-card2 rounded-2xl border border-theme-border/10 p-8 mb-12">
        <h2 className="font-bebas text-2xl text-brand-gold tracking-wider mb-4">
          O QUE É O FIGHT LOG?
        </h2>
        <div className="space-y-4 font-barlow text-theme-text/60 leading-relaxed">
          <p>
            O Fight Log é uma plataforma criada para registrar lutas reais de forma pública,
            permanente e verificável.
          </p>
          <p>
            Nos esportes de combate, o cartel é a moeda mais importante de um atleta. Ainda assim,
            por anos, registros foram fragmentados, esquecidos ou manipulados. Lutas desaparecem.
            Derrotas somem. Cartéis crescem sem confirmação.
          </p>
          <p className="font-bebas text-xl text-brand-red tracking-wider">
            O Fight Log existe para resolver isso.
          </p>
          <p>
            Aqui, cada luta registrada fica visível. Cada resultado pode ser confirmado ou
            contestado. E, uma vez validado, o histórico não pode ser alterado.
          </p>
        </div>
      </div>

      {/* Values */}
      <h2 className="font-bebas text-2xl text-theme-text tracking-wider mb-6 text-center">
        NOSSOS <span className="text-brand-red">VALORES</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        {values.map((item) => (
          <div
            key={item.title}
            className="bg-theme-text/[0.02] rounded-xl border border-theme-border/[0.06] p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-brand-red/10 flex items-center justify-center">
                <Icon name={item.icon} size={20} className="text-brand-red" />
              </div>
              <h3 className="font-bebas text-lg text-theme-text tracking-wider">
                {item.title}
              </h3>
            </div>
            <p className="font-barlow text-sm text-theme-text/40 leading-relaxed">
              {item.description}
            </p>
          </div>
        ))}
      </div>

      {/* Team */}
      <div className="bg-gradient-to-br from-dark-card to-dark-card2 rounded-2xl border border-theme-border/10 p-8">
        <h2 className="font-bebas text-2xl text-brand-gold tracking-wider mb-4">
          EQUIPE
        </h2>
        <p className="font-barlow text-theme-text/60 leading-relaxed">
          O FightLog e desenvolvido por uma equipe apaixonada por tecnologia e modalidades,
          sediada no Brasil. Trabalhamos constantemente para melhorar a plataforma e trazer
          novos recursos para a comunidade. Se voce tem sugestoes ou quer colaborar, entre em
          contato conosco!
        </p>
      </div>
    </main>
  );
}
