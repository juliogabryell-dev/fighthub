import Icon from '@/components/Icon';

export const metadata = {
  title: 'Sobre | FightHub',
};

const values = [
  {
    icon: 'swords',
    title: 'Paixão pelas Lutas',
    description:
      'Nascemos do amor pelas artes marciais e da vontade de criar um espaço dedicado a todos que compartilham essa paixão.',
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
        <h1 className="font-bebas text-5xl text-white tracking-wider">
          SOBRE O <span className="text-brand-red">FIGHTHUB</span>
        </h1>
        <p className="font-barlow text-white/50 mt-3 text-lg max-w-2xl mx-auto">
          A plataforma que conecta o mundo das artes marciais
        </p>
      </div>

      {/* Story */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-white/10 p-8 mb-12">
        <h2 className="font-bebas text-2xl text-brand-gold tracking-wider mb-4">
          NOSSA HISTORIA
        </h2>
        <div className="space-y-4 font-barlow text-white/60 leading-relaxed">
          <p>
            O FightHub nasceu em 2026 com uma missao clara: ser o portal definitivo para
            praticantes de artes marciais no Brasil. Fundado por entusiastas e praticantes,
            a plataforma surgiu da necessidade de um espaco centralizado onde lutadores e
            treinadores pudessem se conectar, compartilhar suas conquistas e encontrar novos
            desafios.
          </p>
          <p>
            Percebemos que o cenario das artes marciais no Brasil, apesar de ser um dos mais
            ricos do mundo, carecia de uma ferramenta digital que unisse toda a comunidade.
            Academias espalhadas por todo o pais, lutadores talentosos sem visibilidade e
            treinadores experientes sem alcance — o FightHub veio para mudar isso.
          </p>
          <p>
            Hoje, a plataforma reune mais de 20 modalidades de artes marciais, desde o
            Jiu-Jitsu Brasileiro e Muay Thai ate modalidades menos conhecidas como Lethwei e
            Sambo. Nosso objetivo e continuar crescendo e democratizando o acesso a informacao
            no mundo das lutas.
          </p>
        </div>
      </div>

      {/* Values */}
      <h2 className="font-bebas text-2xl text-white tracking-wider mb-6 text-center">
        NOSSOS <span className="text-brand-red">VALORES</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        {values.map((item) => (
          <div
            key={item.title}
            className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-brand-red/10 flex items-center justify-center">
                <Icon name={item.icon} size={20} className="text-brand-red" />
              </div>
              <h3 className="font-bebas text-lg text-white tracking-wider">
                {item.title}
              </h3>
            </div>
            <p className="font-barlow text-sm text-white/40 leading-relaxed">
              {item.description}
            </p>
          </div>
        ))}
      </div>

      {/* Team */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-white/10 p-8">
        <h2 className="font-bebas text-2xl text-brand-gold tracking-wider mb-4">
          EQUIPE
        </h2>
        <p className="font-barlow text-white/60 leading-relaxed">
          O FightHub e desenvolvido por uma equipe apaixonada por tecnologia e artes marciais,
          sediada no Brasil. Trabalhamos constantemente para melhorar a plataforma e trazer
          novos recursos para a comunidade. Se voce tem sugestoes ou quer colaborar, entre em
          contato conosco!
        </p>
      </div>
    </main>
  );
}
