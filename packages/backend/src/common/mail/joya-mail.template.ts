/**
 * Joya branded transactional email layout (matches Postmark joya_mail visual theme).
 * Use with sendSimpleMail so the full HTML is sent via Postmark sendEmail.
 */

const JOYA_LOGO_URL = 'https://joya-energy.com/logo_big.webp';
const JOYA_HEADER_BLUE = '#0a4d6e';
const JOYA_CORAL = '#e37051';

export interface JoyaMailLayoutOptions {
  headerTitle: string;
  bodyHtml: string;
  showLogo?: boolean;
}

export function buildJoyaMailHtml(options: JoyaMailLayoutOptions): string {
  const { headerTitle, bodyHtml, showLogo = false } = options;

  const logoRow = showLogo
    ? `
          <tr>
            <td align="center" style="padding:28px 24px 20px;background:#ffffff;">
              <img
                src="${JOYA_LOGO_URL}"
                alt="JOYA Energy"
                width="168"
                height="44"
                style="display:block;width:168px;height:auto;max-width:100%;border:0;"
              />
            </td>
          </tr>`
    : '';

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${headerTitle}</title>
</head>
<body style="margin:0;padding:0;background:#eceff1;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#eceff1;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(15,23,42,0.08);">
          ${logoRow}
          <tr>
            <td align="center" style="background:${JOYA_HEADER_BLUE};padding:22px 28px;">
              <p style="margin:0;font-size:20px;line-height:1.35;font-weight:700;color:#ffffff;">
                ${headerTitle}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 8px;background:#ffffff;font-size:16px;line-height:1.65;color:#1f2937;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;background:#ffffff;text-align:center;color:#9ca3af;font-size:12px;line-height:1.6;">
              <p style="margin:0 0 8px;">© JOYA Energy – All Rights Reserved</p>
              <p style="margin:0 0 8px;">
                JOYA Energy specializes in innovative and sustainable energy solutions.
              </p>
              <p style="margin:0;">
                This is an automated confirmation email. Please do not share sensitive information.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function buildJoyaMailButton(label: string, href: string): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:28px auto;">
      <tr>
        <td align="center" style="border-radius:8px;background:${JOYA_CORAL};">
          <a href="${href}"
             style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>
  `.trim();
}
