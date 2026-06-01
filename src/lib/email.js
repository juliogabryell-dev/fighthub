import nodemailer from 'nodemailer';

/**
 * Envio de emails do app (notificações próprias: formulário de contato, avisos, etc.)
 * via SMTP da Hostinger, usando a conta contato@fightlog.com.br.
 *
 * IMPORTANTE: os emails de CADASTRO e RECUPERAÇÃO DE SENHA são enviados pelo
 * Supabase Auth, não por aqui. Para que esses saiam de contato@fightlog.com.br,
 * configure o "Custom SMTP" no painel do Supabase (Authentication > Emails > SMTP).
 * Veja .env.local.example para os valores.
 *
 * Variáveis de ambiente necessárias:
 *   SMTP_HOST   - ex: smtp.hostinger.com
 *   SMTP_PORT   - ex: 465 (SSL) ou 587 (STARTTLS)
 *   SMTP_USER   - contato@fightlog.com.br
 *   SMTP_PASS   - senha da caixa de email
 *   SMTP_FROM   - remetente, ex: "FightLog <contato@fightlog.com.br>"
 *   EMAIL_TO    - (opcional) destino do formulário de contato; padrão = SMTP_USER
 */

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    // 465 = SSL implícito; 587 = STARTTLS
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

/**
 * Envia um email pelo SMTP configurado.
 *
 * @param {object} opts
 * @param {string} [opts.to] - destinatário(s); padrão = EMAIL_TO ou SMTP_USER
 * @param {string} opts.subject
 * @param {string} [opts.text]
 * @param {string} [opts.html]
 * @param {string} [opts.replyTo]
 * @returns {{ ok: boolean, error?: string }}
 */
export async function sendEmail({ to, subject, text, html, replyTo }) {
  const tx = getTransporter();
  if (!tx) {
    return { ok: false, error: 'SMTP não configurado' };
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const destination = to || process.env.EMAIL_TO || process.env.SMTP_USER;

  try {
    await tx.sendMail({
      from,
      to: destination,
      subject,
      text,
      html,
      replyTo,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
