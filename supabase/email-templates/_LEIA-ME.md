# Templates de email — FightLog

Estes são os templates HTML em português para os emails de autenticação enviados
pelo **Supabase** (cadastro, recuperação de senha, etc.).

> ⚠️ Estes arquivos **não** são usados automaticamente pelo código. Eles precisam ser
> **colados no painel do Supabase**. Ficam aqui só para versionamento/referência.

## Onde colar

No Supabase: **Authentication → Emails → Templates**. Para cada template abaixo,
selecione o tipo correspondente, troque o **Subject (assunto)** e cole o conteúdo do
arquivo `.html` no corpo (modo "Source"/HTML).

| Arquivo | Template no Supabase | Assunto sugerido |
|---|---|---|
| `confirmar-cadastro.html` | Confirm signup | Confirme seu cadastro na FightLog |
| `redefinir-senha.html` | Reset Password | Redefinição de senha — FightLog |
| `magic-link.html` | Magic Link | Seu link de acesso — FightLog |
| `alterar-email.html` | Change Email Address | Confirme seu novo email — FightLog |
| `convite.html` | Invite user | Você foi convidado para a FightLog |
| `reautenticacao.html` | Reauthentication | Seu código de verificação — FightLog |

## Variáveis do Supabase usadas

- `{{ .ConfirmationURL }}` — link de ação (confirmar/redefinir/acessar)
- `{{ .Token }}` — código numérico (usado só na reautenticação)
- `{{ .Email }}` — email do destinatário

Não altere essas variáveis; o Supabase as substitui no envio.

## Dica de entrega (sair do spam)

O email caiu no spam na 1ª vez porque o domínio ainda não tem **SPF/DKIM** configurado.
Na Hostinger (hPanel → Emails → seu domínio → configurações DNS), confirme que existem
os registros **SPF** e **DKIM** do email. Isso melhora muito a reputação e tira do spam.
