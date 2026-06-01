import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

const SUBJECTS = {
  suporte: 'Suporte',
  parceria: 'Parceria',
  sugestao: 'Sugestão',
  bug: 'Reportar Bug',
  outro: 'Outro',
};

// POST: formulário de contato -> envia email para contato@fightlog.com.br
export async function POST(request) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Nome, email e mensagem são obrigatórios' },
        { status: 400 }
      );
    }

    const assunto = SUBJECTS[subject] || 'Contato';

    const result = await sendEmail({
      subject: `[FightLog] ${assunto} — ${name}`,
      replyTo: email,
      text: `Nome: ${name}\nEmail: ${email}\nAssunto: ${assunto}\n\n${message}`,
      html: `
        <h2>Nova mensagem de contato</h2>
        <p><strong>Nome:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Assunto:</strong> ${escapeHtml(assunto)}</p>
        <hr/>
        <p>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>
      `,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
