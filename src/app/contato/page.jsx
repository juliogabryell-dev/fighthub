'use client';

import Icon from '@/components/Icon';

const contacts = [
  {
    icon: 'mail',
    label: 'Email',
    value: 'contato@fighthub.com.br',
    description: 'Responderemos em ate 48 horas uteis',
  },
  {
    icon: 'phone',
    label: 'WhatsApp',
    value: '+55 (11) 99999-0000',
    description: 'Segunda a sexta, das 9h as 18h',
  },
  {
    icon: 'map-pin',
    label: 'Endereco',
    value: 'Sao Paulo, SP - Brasil',
    description: 'Operamos 100% digital',
  },
];

export default function ContatoPage() {
  return (
    <main className="min-h-screen px-6 py-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="font-bebas text-5xl text-white tracking-wider">
          ENTRE EM <span className="text-brand-red">CONTATO</span>
        </h1>
        <p className="font-barlow text-white/50 mt-3 text-lg">
          Estamos aqui para ajudar. Fale conosco!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Info */}
        <div className="space-y-4">
          {contacts.map((item) => (
            <div
              key={item.label}
              className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl border border-white/10 p-5"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-brand-red/10 flex items-center justify-center">
                  <Icon name={item.icon} size={20} className="text-brand-red" />
                </div>
                <div>
                  <p className="font-barlow-condensed text-white text-sm uppercase tracking-wider font-semibold">
                    {item.label}
                  </p>
                  <p className="font-barlow text-brand-gold text-sm">
                    {item.value}
                  </p>
                </div>
              </div>
              <p className="font-barlow text-white/30 text-xs ml-[52px]">
                {item.description}
              </p>
            </div>
          ))}

          {/* Social */}
          <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-5">
            <p className="font-barlow-condensed text-white text-sm uppercase tracking-wider font-semibold mb-3">
              Redes Sociais
            </p>
            <div className="flex gap-3">
              {['Instagram', 'YouTube', 'Twitter'].map((social) => (
                <span
                  key={social}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/40 font-barlow text-xs hover:text-white hover:border-white/20 transition-all cursor-pointer"
                >
                  {social}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-white/10 p-6">
          <h2 className="font-bebas text-xl text-white tracking-wider mb-5">
            ENVIE UMA <span className="text-brand-gold">MENSAGEM</span>
          </h2>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="font-barlow-condensed text-xs text-white/40 uppercase tracking-wider block mb-1.5">
                Nome
              </label>
              <input
                type="text"
                placeholder="Seu nome"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white font-barlow text-sm placeholder:text-white/20 focus:border-brand-red/50 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="font-barlow-condensed text-xs text-white/40 uppercase tracking-wider block mb-1.5">
                Email
              </label>
              <input
                type="email"
                placeholder="seu@email.com"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white font-barlow text-sm placeholder:text-white/20 focus:border-brand-red/50 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="font-barlow-condensed text-xs text-white/40 uppercase tracking-wider block mb-1.5">
                Assunto
              </label>
              <select className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white/60 font-barlow text-sm focus:border-brand-red/50 focus:outline-none transition-colors">
                <option value="">Selecione...</option>
                <option value="suporte">Suporte</option>
                <option value="parceria">Parceria</option>
                <option value="sugestao">Sugestao</option>
                <option value="bug">Reportar Bug</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div>
              <label className="font-barlow-condensed text-xs text-white/40 uppercase tracking-wider block mb-1.5">
                Mensagem
              </label>
              <textarea
                rows={4}
                placeholder="Escreva sua mensagem..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white font-barlow text-sm placeholder:text-white/20 focus:border-brand-red/50 focus:outline-none transition-colors resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#C41E3A] to-[#a01830] text-white font-barlow-condensed uppercase tracking-widest text-sm font-semibold hover:from-[#d42a46] hover:to-[#b82040] transition-all duration-300"
            >
              Enviar Mensagem
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
