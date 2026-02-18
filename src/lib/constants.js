// =============================================================================
// FightHub - Constantes e Dados Estáticos
// Plataforma de Artes Marciais
// =============================================================================

// -----------------------------------------------------------------------------
// MARTIAL_ARTS_DATA - 20 Artes Marciais com dados completos
// -----------------------------------------------------------------------------
export const MARTIAL_ARTS_DATA = [
  {
    id: 1,
    name: "Jiu-Jitsu Brasileiro",
    origin: "Brasil",
    icon: "\u{1F94B}",
    ranking: "Faixas: Branca \u2192 Azul \u2192 Roxa \u2192 Marrom \u2192 Preta \u2192 Coral \u2192 Vermelha",
    history:
      "Desenvolvido pela fam\u00edlia Gracie no in\u00edcio do s\u00e9culo XX, o Jiu-Jitsu Brasileiro revolucionou as artes marciais ao provar a efic\u00e1cia do combate no solo. Ganhou fama mundial quando Royce Gracie venceu os primeiros eventos do UFC, derrotando oponentes muito maiores. Hoje \u00e9 considerado uma das bases fundamentais do MMA moderno e \u00e9 praticado em todos os continentes.",
    popularRegion: "Brasil, Estados Unidos, Austr\u00e1lia",
  },
  {
    id: 2,
    name: "Muay Thai",
    origin: "Tail\u00e2ndia",
    icon: "\u{1F94A}",
    ranking: "Prajon: Branca \u2192 Amarela \u2192 Verde \u2192 Azul \u2192 Marrom \u2192 Vermelha",
    history:
      "Conhecida como a \"Arte das Oito Armas\", o Muay Thai utiliza punhos, cotovelos, joelhos e canelas como pontos de contato. Originado nos campos de batalha do antigo Reino do Si\u00e3o, evoluiu de t\u00e9cnica militar para esporte nacional da Tail\u00e2ndia. \u00c9 amplamente reconhecido como a arte de trocação mais eficaz do mundo, sendo pilar fundamental do MMA contempor\u00e2neo.",
    popularRegion: "Tail\u00e2ndia, Holanda, Brasil",
  },
  {
    id: 3,
    name: "Boxe",
    origin: "Inglaterra",
    icon: "\u{1F94A}",
    ranking: "Rankings por federa\u00e7\u00f5es (WBC, WBA, IBF, WBO)",
    history:
      "O Boxe tem ra\u00edzes na Gr\u00e9cia Antiga, onde j\u00e1 era praticado nos Jogos Ol\u00edmpicos em 688 a.C. As regras modernas foram estabelecidas pelo Marqu\u00eas de Queensberry em 1867, introduzindo luvas, rounds cronometrados e categorias de peso. Considerado o \"Nobre Arte\", o Boxe produziu alguns dos maiores \u00eddolos do esporte mundial, como Muhammad Ali, Sugar Ray Robinson e Mike Tyson.",
    popularRegion: "Estados Unidos, M\u00e9xico, Reino Unido, Filipinas",
  },
  {
    id: 4,
    name: "Jud\u00f4",
    origin: "Jap\u00e3o",
    icon: "\u{1F94B}",
    ranking: "Faixas: Branca \u2192 Amarela \u2192 Laranja \u2192 Verde \u2192 Azul \u2192 Marrom \u2192 Preta (1\u00ba a 10\u00ba Dan)",
    history:
      "Criado por Jigoro Kano em 1882, o Jud\u00f4 nasceu como uma evolu\u00e7\u00e3o do Jiu-Jitsu japon\u00eas tradicional, enfatizando o princ\u00edpio da m\u00e1xima efici\u00eancia com o m\u00ednimo esfor\u00e7o. Tornou-se o primeiro esporte de combate oriental a integrar os Jogos Ol\u00edmpicos, em T\u00f3quio 1964. O Brasil \u00e9 uma pot\u00eancia mundial na modalidade, com nomes hist\u00f3ricos como Aureliano e Rafaela Silva.",
    popularRegion: "Jap\u00e3o, Fran\u00e7a, Brasil, Coreia do Sul",
  },
  {
    id: 5,
    name: "Karat\u00ea",
    origin: "Jap\u00e3o (Okinawa)",
    icon: "\u{1F94B}",
    ranking: "Faixas: Branca \u2192 Amarela \u2192 Laranja \u2192 Verde \u2192 Azul \u2192 Marrom \u2192 Preta (1\u00ba a 10\u00ba Dan)",
    history:
      "Originado na ilha de Okinawa, o Karat\u00ea se desenvolveu a partir da fus\u00e3o de t\u00e9cnicas locais com artes marciais chinesas, quando armas foram proibidas na regi\u00e3o. Possui diversos estilos tradicionais como Shotokan, Goju-Ryu, Shito-Ryu e Wado-Ryu, cada um com caracter\u00edsticas pr\u00f3prias. Estreou nos Jogos Ol\u00edmpicos de T\u00f3quio 2020, consolidando-se como um dos esportes de combate mais praticados do planeta.",
    popularRegion: "Jap\u00e3o, Fran\u00e7a, Espanha, Egito",
  },
  {
    id: 6,
    name: "Taekwondo",
    origin: "Coreia do Sul",
    icon: "\u{1F9B5}",
    ranking: "Faixas: Branca \u2192 Amarela \u2192 Verde \u2192 Azul \u2192 Vermelha \u2192 Preta (1\u00ba a 9\u00ba Dan)",
    history:
      "Arte marcial coreana conhecida por seus chutes espetaculares de alta velocidade e precis\u00e3o, o Taekwondo combina t\u00e9cnicas ancestrais de combate da pen\u00ednsula coreana. Tornou-se esporte ol\u00edmpico oficial nos Jogos de Sydney 2000, ganhando enorme popularidade mundial. O Brasil possui uma forte tradi\u00e7\u00e3o na modalidade, com diversas medalhas ol\u00edmpicas conquistadas.",
    popularRegion: "Coreia do Sul, Ir\u00e3, M\u00e9xico, Brasil",
  },
  {
    id: 7,
    name: "Wrestling / Luta Livre",
    origin: "Antiguidade",
    icon: "\u{1F93C}",
    ranking: "Rankings por competi\u00e7\u00f5es e categorias de peso",
    history:
      "A luta \u00e9 uma das formas de combate mais antigas da humanidade, com registros que datam de mais de 5.000 anos em civiliza\u00e7\u00f5es como Sum\u00e9ria e Egito. Presente nos Jogos Ol\u00edmpicos da Antiguidade, permanece no programa ol\u00edmpico moderno desde sua primeira edi\u00e7\u00e3o em 1896. \u00c9 amplamente considerada a base mais importante para o MMA, fornecendo controle de dist\u00e2ncia e domin\u00e2ncia posicional.",
    popularRegion: "Estados Unidos, R\u00fassia, Ir\u00e3, Turquia",
  },
  {
    id: 8,
    name: "Kung Fu / Wushu",
    origin: "China",
    icon: "\u{1F409}",
    ranking: "Estudante \u2192 Disc\u00edpulo \u2192 Instrutor \u2192 Mestre \u2192 Gr\u00e3o-Mestre",
    history:
      "O Kung Fu engloba centenas de estilos de artes marciais chinesas desenvolvidos ao longo de mil\u00eanios, desde os monges do Templo Shaolin at\u00e9 as escolas de Wudang. Cada estilo possui filosofia e t\u00e9cnicas \u00fanicas, inspirados frequentemente em movimentos de animais como o tigre, a gara, a serpente e o louva-a-deus. O Wushu moderno \u00e9 a vers\u00e3o esportiva padronizada, buscando reconhecimento ol\u00edmpico.",
    popularRegion: "China, Vietn\u00e3, Mal\u00e1sia, Brasil",
  },
  {
    id: 9,
    name: "Kickboxing",
    origin: "Jap\u00e3o/EUA",
    icon: "\u{1F94A}",
    ranking: "Rankings por organiza\u00e7\u00f5es (GLORY, K-1, ONE Championship)",
    history:
      "O Kickboxing surgiu entre as d\u00e9cadas de 1960 e 1970 como uma fus\u00e3o entre o Karat\u00ea japon\u00eas e o Boxe ocidental, criando um esporte de trocação din\u00e2mico e empolgante. Ganhou enorme popularidade mundial atrav\u00e9s de organiza\u00e7\u00f5es como o K-1 no Jap\u00e3o e o GLORY na Holanda. A escola holandesa de Kickboxing \u00e9 amplamente reconhecida como a mais dominante, produzindo lendas como Ernesto Hoost, Semmy Schilt e Rico Verhoeven.",
    popularRegion: "Holanda, Jap\u00e3o, Estados Unidos, Marrocos",
  },
  {
    id: 10,
    name: "Capoeira",
    origin: "Brasil",
    icon: "\u{1F3B5}",
    ranking: "Cordas: Crua \u2192 Amarela \u2192 Laranja \u2192 Azul \u2192 Verde \u2192 Roxa \u2192 Marrom \u2192 Vermelha \u2192 Branca",
    history:
      "A Capoeira \u00e9 uma express\u00e3o cultural afro-brasileira que combina luta, dan\u00e7a, acrobacia e m\u00fasica, criada por africanos escravizados no Brasil colonial como forma de resist\u00eancia. Reconhecida pela UNESCO como Patrim\u00f4nio Cultural Imaterial da Humanidade em 2014, \u00e9 um s\u00edmbolo da identidade brasileira. Hoje \u00e9 praticada em mais de 160 pa\u00edses, encantando o mundo com sua ginga, musicalidade e movimentos acrob\u00e1ticos.",
    popularRegion: "Brasil, Estados Unidos, Europa",
  },
  {
    id: 11,
    name: "Krav Maga",
    origin: "Israel",
    icon: "\u2694\uFE0F",
    ranking: "Praticante (P1-P5) \u2192 Graduado (G1-G5) \u2192 Expert (E1-E5)",
    history:
      "Desenvolvido por Imi Lichtenfeld para as For\u00e7as de Defesa de Israel (IDF), o Krav Maga \u00e9 um sistema de defesa pessoal focado em situa\u00e7\u00f5es reais de combate e sobreviv\u00eancia. Suas t\u00e9cnicas priorizam a neutraliza\u00e7\u00e3o r\u00e1pida de amea\u00e7as, utilizando golpes em pontos vulner\u00e1veis e defesas contra armas. Amplamente adotado por for\u00e7as militares e policiais em todo o mundo, \u00e9 considerado um dos sistemas de autodefesa mais pr\u00e1ticos e eficientes.",
    popularRegion: "Israel, Estados Unidos, Fran\u00e7a, Brasil",
  },
  {
    id: 12,
    name: "MMA (Artes Marciais Mistas)",
    origin: "Global",
    icon: "\u{1F3DF}\uFE0F",
    ranking: "Rankings por organiza\u00e7\u00f5es (UFC, Bellator, ONE Championship)",
    history:
      "O MMA moderno evoluiu a partir do vale-tudo brasileiro e dos primeiros eventos do UFC em 1993, que buscavam determinar qual arte marcial era a mais eficaz em combate real. Com o tempo, os lutadores passaram a dominar m\u00faltiplas disciplinas, criando um esporte completo e altamente t\u00e9cnico. Hoje o UFC \u00e9 uma das maiores organiza\u00e7\u00f5es esportivas do planeta, com lutadores brasileiros entre os maiores campe\u00f5es da hist\u00f3ria.",
    popularRegion: "Estados Unidos, Brasil, R\u00fassia, Irlanda",
  },
  {
    id: 13,
    name: "Sambo",
    origin: "R\u00fassia",
    icon: "\u{1F1F7}\u{1F1FA}",
    ranking: "3\u00aa Classe \u2192 2\u00aa Classe \u2192 1\u00aa Classe \u2192 Candidato a Mestre \u2192 Mestre do Esporte \u2192 Mestre Internacional",
    history:
      "Criado na d\u00e9cada de 1920 para o ex\u00e9rcito sovi\u00e9tico, o Sambo (SAMozashchita Bez Oruzhiya - Autodefesa Sem Armas) combina t\u00e9cnicas do Jud\u00f4, Wrestling e artes marciais regionais da Uni\u00e3o Sovi\u00e9tica. Possui duas vertentes principais: o Sambo Esportivo (similar ao Jud\u00f4) e o Combat Sambo (que inclui golpes). \u00c9 a base de lutadores lend\u00e1rios do MMA como Khabib Nurmagomedov e Fedor Emelianenko.",
    popularRegion: "R\u00fassia, Ge\u00f3rgia, Uzbequist\u00e3o, Mong\u00f3lia",
  },
  {
    id: 14,
    name: "Aikido",
    origin: "Jap\u00e3o",
    icon: "\u262F\uFE0F",
    ranking: "Faixas: Branca (6\u00ba a 1\u00ba Kyu) \u2192 Preta (1\u00ba a 10\u00ba Dan)",
    history:
      "Fundado por Morihei Ueshiba na d\u00e9cada de 1920, o Aikido \u00e9 uma arte marcial japonesa baseada na filosofia da harmonia e n\u00e3o-resist\u00eancia, redirecionando a for\u00e7a do oponente contra ele mesmo. Diferente de outras artes marciais, n\u00e3o possui competi\u00e7\u00f5es formais, priorizando o desenvolvimento espiritual e a resolu\u00e7\u00e3o pac\u00edfica de conflitos. Suas t\u00e9cnicas elegantes de proje\u00e7\u00f5es e imobiliza\u00e7\u00f5es articulares influenciaram diversas outras artes marciais.",
    popularRegion: "Jap\u00e3o, Fran\u00e7a, Estados Unidos, R\u00fassia",
  },
  {
    id: 15,
    name: "Boxe Chin\u00eas (Sanda/Sanshou)",
    origin: "China",
    icon: "\u{1F432}",
    ranking: "Rankings por competi\u00e7\u00f5es e categorias de peso",
    history:
      "O Sanda, tamb\u00e9m conhecido como Sanshou, \u00e9 a modalidade de combate do Wushu chin\u00eas, desenvolvida pelo ex\u00e9rcito chin\u00eas como sistema de luta eficaz. Combina socos, chutes, joelhadas e proje\u00e7\u00f5es espetaculares, sendo disputado em uma plataforma elevada (lei tai) onde derrubar o oponente da plataforma \u00e9 uma forma de pontuar. \u00c9 um esporte de combate completo que vem ganhando reconhecimento internacional.",
    popularRegion: "China, Vietn\u00e3, Ir\u00e3",
  },
  {
    id: 16,
    name: "Hapkido",
    origin: "Coreia do Sul",
    icon: "\u{1F300}",
    ranking: "Faixas: Branca \u2192 Amarela \u2192 Verde \u2192 Azul \u2192 Vermelha \u2192 Preta (1\u00ba a 9\u00ba Dan)",
    history:
      "Fundado por Choi Yong-sool ap\u00f3s a Segunda Guerra Mundial, o Hapkido \u00e9 uma arte marcial coreana completa que integra chutes, socos, proje\u00e7\u00f5es, chaves articulares e t\u00e9cnicas com armas tradicionais. Seu nome significa \"caminho da energia coordenada\", refletindo o princ\u00edpio de utilizar a for\u00e7a do oponente de forma harm\u00f4nica. \u00c9 amplamente utilizado por for\u00e7as policiais e militares da Coreia do Sul como sistema de defesa pessoal.",
    popularRegion: "Coreia do Sul, Estados Unidos, Ir\u00e3",
  },
  {
    id: 17,
    name: "Luta Greco-Romana",
    origin: "Fran\u00e7a/Europa",
    icon: "\u{1F3DB}\uFE0F",
    ranking: "Categorias de peso ol\u00edmpicas e rankings por federa\u00e7\u00e3o",
    history:
      "A Luta Greco-Romana \u00e9 um dos esportes mais tradicionais dos Jogos Ol\u00edmpicos, presente desde a primeira edi\u00e7\u00e3o moderna em Atenas 1896. Diferencia-se por proibir ataques abaixo da cintura, exigindo dos lutadores enorme for\u00e7a na parte superior do corpo e t\u00e9cnica refinada de proje\u00e7\u00f5es. Pa\u00edses do Leste Europeu e do C\u00e1ucaso historicamente dominam a modalidade, com destaque para R\u00fassia, Cuba e Ir\u00e3.",
    popularRegion: "R\u00fassia, Cuba, Ir\u00e3, Turquia",
  },
  {
    id: 18,
    name: "Jeet Kune Do",
    origin: "Estados Unidos",
    icon: "\u{1F4A7}",
    ranking: "Sem gradua\u00e7\u00e3o formal \u2014 filosofia de evolu\u00e7\u00e3o cont\u00ednua",
    history:
      "Criado por Bruce Lee em 1967, o Jeet Kune Do (\"O Caminho do Punho Interceptador\") n\u00e3o \u00e9 um estilo fixo, mas uma filosofia de combate que defende a adapta\u00e7\u00e3o e a liberdade t\u00e9cnica. Bruce Lee rejeitava os estilos r\u00edgidos tradicionais, incentivando o praticante a absorver o que \u00e9 \u00fatil e descartar o que n\u00e3o \u00e9. Essa mentalidade pioneira influenciou profundamente o desenvolvimento do MMA moderno e a forma como lutadores treinam hoje.",
    popularRegion: "Estados Unidos, Hong Kong, Europa",
  },
  {
    id: 19,
    name: "Esgrima",
    origin: "Europa",
    icon: "\u{1F93A}",
    ranking: "Rankings da FIE (F\u00e9d\u00e9ration Internationale d'Escrime) por arma: Florete, Espada, Sabre",
    history:
      "A Esgrima evoluiu das t\u00e9cnicas de combate com espadas do per\u00edodo renascentista europeu, tornando-se um esporte refinado de precis\u00e3o e estrat\u00e9gia. \u00c9 um dos poucos esportes presentes em todas as edi\u00e7\u00f5es dos Jogos Ol\u00edmpicos modernos, desde Atenas 1896. Possui tr\u00eas modalidades distintas \u2014 Florete, Espada e Sabre \u2014 cada uma com regras espec\u00edficas de \u00e1rea-alvo e prioridade de ataque.",
    popularRegion: "It\u00e1lia, Fran\u00e7a, Hungria, R\u00fassia",
  },
  {
    id: 20,
    name: "Lethwei",
    origin: "Myanmar",
    icon: "\u{1F1F2}\u{1F1F2}",
    ranking: "Rankings baseados em vit\u00f3rias e desempenho em competi\u00e7\u00f5es",
    history:
      "O Lethwei, conhecido como \"Boxe Birman\u00eas\", \u00e9 uma das artes marciais mais brutais do mundo, sendo a \u00fanica que permite cabe\u00e7adas como t\u00e9cnica legal de ataque. Tradicionalmente lutado sem luvas, apenas com bandagens nas m\u00e3os, e a \u00fanica forma de vit\u00f3ria \u00e9 por nocaute. Com ra\u00edzes milenares em Myanmar, o Lethwei vem ganhando aten\u00e7\u00e3o internacional por sua intensidade e o crescente interesse global em artes marciais tradicionais.",
    popularRegion: "Myanmar, Tail\u00e2ndia, Jap\u00e3o",
  },
];

// -----------------------------------------------------------------------------
// SAMPLE_NEWS - Not\u00edcias de exemplo sobre artes marciais
// -----------------------------------------------------------------------------
export const SAMPLE_NEWS = [
  {
    id: 1,
    title: "UFC 315: Brasileiro conquista cintur\u00e3o dos meio-pesados em luta hist\u00f3rica",
    summary:
      "Em uma noite inesquec\u00edvel em Las Vegas, o lutador brasileiro dominou todas as parciais e conquistou o cintur\u00e3o dos meio-pesados do UFC, entrando para a hist\u00f3ria como o mais jovem campe\u00e3o da categoria. A vit\u00f3ria veio por decis\u00e3o un\u00e2nime ap\u00f3s cinco rounds de dom\u00ednio t\u00e9cnico absoluto.",
    date: "2026-02-15",
    category: "MMA",
    image: "\u{1F3C6}",
  },
  {
    id: 2,
    title: "Campeonato Mundial de Jiu-Jitsu 2026 anuncia local e data",
    summary:
      "A IBJJF confirmou que o Mundial de Jiu-Jitsu 2026 ser\u00e1 realizado em junho, na Calif\u00f3rnia. O evento reunir\u00e1 os melhores competidores de faixa preta do mundo, com destaque para a forte delega\u00e7\u00e3o brasileira que promete dominar o tatame mais uma vez.",
    date: "2026-02-12",
    category: "Jiu-Jitsu",
    image: "\u{1F94B}",
  },
  {
    id: 3,
    title: "ONE Championship expande opera\u00e7\u00f5es para a Am\u00e9rica do Sul",
    summary:
      "A organiza\u00e7\u00e3o asi\u00e1tica ONE Championship anunciou planos de realizar eventos no Brasil e na Argentina a partir do segundo semestre de 2026. A expans\u00e3o inclui card de Muay Thai, Kickboxing e MMA, aproveitando a enorme base de f\u00e3s de artes marciais na regi\u00e3o.",
    date: "2026-02-10",
    category: "Eventos",
    image: "\u{1F30F}",
  },
  {
    id: 4,
    title: "Sele\u00e7\u00e3o Brasileira de Jud\u00f4 inicia prepara\u00e7\u00e3o para o ciclo ol\u00edmpico de Los Angeles 2028",
    summary:
      "Com foco nos Jogos Ol\u00edmpicos de 2028, a sele\u00e7\u00e3o brasileira de Jud\u00f4 iniciou um programa intensivo de treinamento com est\u00e1gios no Jap\u00e3o e na Fran\u00e7a. A equipe aposta em jovens talentos revelados nos \u00faltimos campeonatos mundiais para renovar o time ol\u00edmpico.",
    date: "2026-02-08",
    category: "Jud\u00f4",
    image: "\u{1F947}",
  },
  {
    id: 5,
    title: "Estudo cient\u00edfico comprova benef\u00edcios das artes marciais para sa\u00fade mental",
    summary:
      "Pesquisa publicada por universidades brasileiras e americanas demonstrou que a pr\u00e1tica regular de artes marciais reduz significativamente n\u00edveis de ansiedade e depress\u00e3o. O estudo acompanhou 2.000 praticantes por dois anos e revelou melhorias expressivas em autoconfian\u00e7a, disciplina e bem-estar geral.",
    date: "2026-02-05",
    category: "Sa\u00fade",
    image: "\u{1F9E0}",
  },
  {
    id: 6,
    title: "Capoeira ganha espa\u00e7o em academias da Europa e \u00c1sia",
    summary:
      "A Capoeira vive um momento de expans\u00e3o global, com aumento de 40% no n\u00famero de academias na Europa e \u00c1sia nos \u00faltimos tr\u00eas anos. Mestres brasileiros est\u00e3o liderando o movimento, levando n\u00e3o apenas a pr\u00e1tica marcial, mas toda a riqueza cultural que envolve a roda de Capoeira.",
    date: "2026-02-02",
    category: "Capoeira",
    image: "\u{1F3B6}",
  },
];

// -----------------------------------------------------------------------------
// NAV_LINKS - Links de navega\u00e7\u00e3o da plataforma
// -----------------------------------------------------------------------------
export const NAV_LINKS = [
  {
    key: "home",
    label: "In\u00edcio",
    href: "/",
    icon: "\u{1F3E0}",
  },
  {
    key: "martial-arts",
    label: "Artes Marciais",
    href: "/artes-marciais",
    icon: "\u{1F94B}",
  },
  {
    key: "fighters",
    label: "Lutadores",
    href: "/lutadores",
    icon: "\u{1F94A}",
  },
  {
    key: "coaches",
    label: "Treinadores",
    href: "/treinadores",
    icon: "\u{1F4CB}",
  },
  {
    key: "news",
    label: "Not\u00edcias",
    href: "/noticias",
    icon: "\u{1F4F0}",
  },
];
