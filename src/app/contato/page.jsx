'use client';

import { useState } from 'react';
import Icon from '@/components/Icon';

const contacts = [
  {
    icon: 'mail',
    label: 'Email',
    value: 'contato@fightlog.com.br',
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
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [errorMsg, setErrorMsg] = useState('');

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Não foi possível enviar a mensagem.');
        setStatus('error');
        return;
      }

      setStatus('success');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch {
      setErrorMsg('Ocorreu um erro inesperado. Tente novamente.');
      setStatus('error');
    }
  }

  return (
    <main className="min-h-screen px-6 py-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="font-bebas text-5xl text-theme-text tracking-wider">
          ENTRE EM <span className="text-brand-red">CONTATO</span>
        </h1>
        <p className="font-barlow text-theme-text/50 mt-3 text-lg">
          Estamos aqui para ajudar. Fale conosco!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Info */}
        <div className="space-y-4">
          {contacts.map((item) => (
            <div
              key={item.label}
              className="bg-gradient-to-br from-dark-card to-dark-card2 rounded-xl border border-theme-border/10 p-5"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-brand-red/10 flex items-center justify-center">
                  <Icon name={item.icon} size={20} className="text-brand-red" />
                </div>
                <div>
                  <p className="font-barlow-condensed text-theme-text text-sm uppercase tracking-wider font-semibold">
                    {item.label}
                  </p>
                  <p className="font-barlow text-brand-gold text-sm">
                    {item.value}
                  </p>
                </div>
              </div>
              <p className="font-barlow text-theme-text/30 text-xs ml-[52px]">
                {item.description}
              </p>
            </div>
          ))}

          {/* Social */}
          <div className="bg-theme-text/[0.02] rounded-xl border border-theme-border/[0.06] p-5">
            <p className="font-barlow-condensed text-theme-text text-sm uppercase tracking-wider font-semibold mb-3">
              Redes Sociais
            </p>
            <div className="flex gap-3">
              {['Instagram', 'YouTube', 'Twitter'].map((social) => (
                <span
                  key={social}
                  className="px-3 py-1.5 rounded-lg bg-theme-text/5 border border-theme-border/10 text-theme-text/40 font-barlow text-xs hover:text-theme-text hover:border-theme-border/20 transition-all cursor-pointer"
                >
                  {social}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-gradient-to-br from-dark-card to-dark-card2 rounded-2xl border border-theme-border/10 p-6">
          <h2 className="font-bebas text-xl text-theme-text tracking-wider mb-5">
            ENVIE UMA <span className="text-brand-gold">MENSAGEM</span>
          </h2>
          {status === 'success' && (
            <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
              <p className="font-barlow text-green-400 text-sm text-center">
                Mensagem enviada com sucesso! Responderemos em ate 48 horas uteis.
              </p>
            </div>
          )}
          {status === 'error' && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="font-barlow text-red-400 text-sm text-center">{errorMsg}</p>
            </div>
          )}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="font-barlow-condensed text-xs text-theme-text/40 uppercase tracking-wider block mb-1.5">
                Nome
              </label>
              <input
                type="text"
                placeholder="Seu nome"
                value={form.name}
                onChange={update('name')}
                required
                className="w-full bg-theme-text/5 border border-theme-border/10 rounded-lg px-4 py-2.5 text-theme-text font-barlow text-sm placeholder:text-theme-text/20 focus:border-brand-red/50 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="font-barlow-condensed text-xs text-theme-text/40 uppercase tracking-wider block mb-1.5">
                Email
              </label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={form.email}
                onChange={update('email')}
                required
                className="w-full bg-theme-text/5 border border-theme-border/10 rounded-lg px-4 py-2.5 text-theme-text font-barlow text-sm placeholder:text-theme-text/20 focus:border-brand-red/50 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="font-barlow-condensed text-xs text-theme-text/40 uppercase tracking-wider block mb-1.5">
                Assunto
              </label>
              <select
                value={form.subject}
                onChange={update('subject')}
                className="w-full bg-theme-text/5 border border-theme-border/10 rounded-lg px-4 py-2.5 text-theme-text/60 font-barlow text-sm focus:border-brand-red/50 focus:outline-none transition-colors"
              >
                <option value="">Selecione...</option>
                <option value="suporte">Suporte</option>
                <option value="parceria">Parceria</option>
                <option value="sugestao">Sugestao</option>
                <option value="bug">Reportar Bug</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div>
              <label className="font-barlow-condensed text-xs text-theme-text/40 uppercase tracking-wider block mb-1.5">
                Mensagem
              </label>
              <textarea
                rows={4}
                placeholder="Escreva sua mensagem..."
                value={form.message}
                onChange={update('message')}
                required
                className="w-full bg-theme-text/5 border border-theme-border/10 rounded-lg px-4 py-2.5 text-theme-text font-barlow text-sm placeholder:text-theme-text/20 focus:border-brand-red/50 focus:outline-none transition-colors resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#C41E3A] to-[#a01830] text-white font-barlow-condensed uppercase tracking-widest text-sm font-semibold hover:from-[#d42a46] hover:to-[#b82040] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'sending' ? 'Enviando...' : 'Enviar Mensagem'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
