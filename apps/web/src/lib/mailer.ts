import nodemailer, { Transporter } from "nodemailer";

function bool(v: string | undefined, def = false) {
  if (v == null) return def;
  return ["1", "true", "yes", "on"].includes(v.toLowerCase());
}

let cached: Transporter | null = null;

export function getTransport() {
  if (cached) return cached;

  const host = process.env.SMTP_HOST || "";
  const port = Number(process.env.SMTP_PORT || (process.env.SMTP_SECURE ? 465 : 587));
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";
  const secure = bool(process.env.SMTP_SECURE, port === 465); // 465 => SSL, 587 => STARTTLS

  if (!host) throw new Error("SMTP_HOST is missing");
  const hasAuth = Boolean(user && pass);

  cached = nodemailer.createTransport({
    host,
    port,
    secure,              // true => SSL (465), false => STARTTLS (587)
    auth: hasAuth ? { user, pass } : undefined,
    requireTLS: !secure, // штовхаємо STARTTLS на 587
    pool: true,
    maxConnections: 2,
    maxMessages: 50,
    connectionTimeout: 10_000,
    socketTimeout: 10_000,
    greetingTimeout: 10_000,
    tls: {
      // servername: host,
      // rejectUnauthorized: false, // не вмикати у проді
    },
  });

  return cached;
}

export async function sendInviteEmail(to: string, inviteLink: string) {
  const BRAND = "CharmOps";
  const from =
    process.env.SMTP_FROM ||
    `CharmOps <no-reply@${(process.env.NEXT_PUBLIC_APP_URL || "charmops.local").replace(/^https?:\/\//, "")}>`;

  // Короткий прев’ю-рядок (після теми)
  const preheader = "Вас запрошено до CharmOps. Прийміть інвайт і встановіть пароль.";

  // Основні кольори (інлайн далі продубльовано)
  const indigo = "#4f46e5";          // indigo-600
  const indigoLight = "#eef2ff";     // indigo-50
  const slate900 = "#0f172a";        // slate-900
  const slate700 = "#334155";        // slate-700
  const slate500 = "#64748b";        // slate-500
  const slate200 = "#e2e8f0";        // slate-200
  const white = "#ffffff";

  const html = `
<!doctype html>
<html lang="uk" style="margin:0;padding:0;">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${BRAND} — Запрошення</title>
  <style>
    /* Темна тема для сучасних клієнтів */
    @media (prefers-color-scheme: dark) {
      .bg-body    { background: #0b1020 !important; }
      .card       { background: #0f152a !important; border-color: #1e293b !important; }
      .text-main  { color: #e5e7eb !important; }
      .text-dim   { color: #94a3b8 !important; }
      .divider    { border-color: #1e293b !important; }
      .brand-chip { background: rgba(79,70,229,0.15) !important; color:#c7d2fe !important; }
      .btn        { background: ${indigo} !important; color: #fff !important; }
      .muted      { color:#9ca3af !important; }
    }
    /* Mobile */
    @media (max-width: 600px) {
      .container { width: 100% !important; }
    }
    /* iOS link styling reset */
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
  </style>
</head>
<body class="bg-body" style="margin:0;padding:0;background:${indigoLight};">
  <!-- Preheader (приховано) -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${preheader}
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${indigoLight};padding:24px 0;">
    <tr>
      <td align="center">
        <table class="container" role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;">
          <!-- Header -->
          <tr>
            <td style="padding:0 24px 16px 24px;">
              <table role="presentation" width="100%">
                <tr>
                  <td align="left" style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
                    <span class="brand-chip" style="display:inline-grid;place-items:center;height:40px;width:40px;border-radius:12px;background:${indigo};color:#fff;font-weight:700;box-shadow:0 2px 6px rgba(79,70,229,0.35);">C</span>
                  </td>
                  <td align="right" style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; color:${slate500}; font-size:12px;">
                    ${BRAND}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="padding:0 24px;">
              <table class="card" role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${white};border:1px solid ${slate200};border-radius:20px;box-shadow:0 4px 14px rgba(15,23,42,0.08);">
                <tr>
                  <td style="padding:28px 24px 8px 24px;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:${slate900};">
                    <h2 style="margin:0;font-size:22px;line-height:1.3;">Запрошення до ${BRAND}</h2>
                    <p class="text-dim" style="margin:8px 0 0 0;color:${slate700};font-size:14px;line-height:1.6;">
                      Вас запрошено приєднатися до робочої панелі ${BRAND}. Натисніть кнопку нижче, щоб прийняти інвайт і встановити пароль.
                    </p>
                  </td>
                </tr>

                <!-- Button -->
                <tr>
                  <td align="center" style="padding:16px 24px 6px 24px;">
                    <a
                      href="${inviteLink}"
                      class="btn"
                      style="display:inline-block;background:${indigo};color:#fff;text-decoration:none;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:14px;font-weight:600;padding:12px 18px;border-radius:12px;box-shadow:0 2px 10px rgba(79,70,229,0.35);"
                    >Прийняти запрошення</a>
                  </td>
                </tr>

                <!-- Fallback link -->
                <tr>
                  <td style="padding:8px 24px 6px 24px;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
                    <p class="muted" style="margin:0;color:${slate500};font-size:12px;line-height:1.6;">
                      Якщо кнопка не працює, скопіюйте та вставте це посилання у браузер:
                    </p>
                    <p style="margin:6px 0 0 0;font-size:12px;line-height:1.6;word-break:break-all;">
                      <a href="${inviteLink}" style="color:${indigo};text-decoration:underline;">${inviteLink}</a>
                    </p>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding:14px 24px 0 24px;">
                    <hr class="divider" style="border:none;border-top:1px solid ${slate200};margin:0;" />
                  </td>
                </tr>

                <!-- Footer inside card -->
                <tr>
                  <td style="padding:12px 24px 20px 24px;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
                    <p class="text-dim" style="margin:0;color:${slate700};font-size:12px;line-height:1.6;">
                      Якщо ви не очікували цього листа, просто ігноруйте його.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Global footer -->
          <tr>
            <td align="center" style="padding:16px 24px 0 24px;">
              <p class="text-dim" style="margin:0;color:${slate500};font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:12px;line-height:1.6;">
                © ${new Date().getFullYear()} ${BRAND}. Усі права захищено.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 24px;">
              <p class="text-dim" style="margin:0;color:${slate500};font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:11px;line-height:1.6;">
                Це системний лист, не відповідайте на нього.
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

  const text = `Вас запрошено до ${BRAND}.

Щоб прийняти інвайт і встановити пароль, відкрийте посилання:
${inviteLink}

Якщо ви не очікували цього листа — просто проігноруйте його.
© ${new Date().getFullYear()} ${BRAND}
`;

  const transporter = getTransport();
  return transporter.sendMail({
    to,
    from,
    subject: `${BRAND}: ваше запрошення`,
    html,
    text,
  });
}
