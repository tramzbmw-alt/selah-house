import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const FROM_EMAIL = "noreply@selahbytheseanc.com";

function fmtDate(d: string) {
  const [y, m, day] = d.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(m) - 1]} ${parseInt(day)}, ${y}`;
}

export async function POST(req: NextRequest) {
  const { guestName, email, checkIn, checkOut, nights, total, message } = await req.json();

  if (!guestName || !email || !checkIn || !checkOut || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Email not configured" }, { status: 500 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  // Convert plain-text message to paragraphs
  const messageParagraphs = String(message)
    .split(/\n+/)
    .filter(p => p.trim())
    .map(p => `<p style="font-size:15px;color:#1c1c1a;line-height:1.7;margin:0 0 16px;">${p.trim()}</p>`)
    .join("");

  const html = `
    <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#f8f7f4;">
      <div style="background:#1a3d3a;border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;">
        <h1 style="color:#fff;font-size:20px;margin:0;font-weight:700;">Selah by the Sea</h1>
        <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:8px 0 0;">Coastal Vacation Rental · Wilmington, NC</p>
      </div>

      <div style="background:#fff;border-radius:12px;padding:28px;border:1px solid #e4e2dc;">
        ${messageParagraphs}

        <div style="border-top:1px solid #f0ede8;margin:20px 0;"></div>

        <div style="font-size:12px;font-weight:600;color:#9e9b93;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:12px;">Booking details</div>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#6b6960;width:120px;border-bottom:1px solid #f0ede8;">Check-in</td>
            <td style="padding:8px 0;font-size:14px;color:#1c1c1a;font-weight:600;border-bottom:1px solid #f0ede8;">${fmtDate(checkIn)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#6b6960;border-bottom:1px solid #f0ede8;">Check-out</td>
            <td style="padding:8px 0;font-size:14px;color:#1c1c1a;font-weight:600;border-bottom:1px solid #f0ede8;">${fmtDate(checkOut)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#6b6960;border-bottom:1px solid #f0ede8;">Nights</td>
            <td style="padding:8px 0;font-size:14px;color:#1c1c1a;border-bottom:1px solid #f0ede8;">${nights}</td>
          </tr>
          ${total > 0 ? `
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#6b6960;">Total</td>
            <td style="padding:8px 0;font-size:15px;color:#1a3d3a;font-weight:700;">$${Number(total).toLocaleString()}</td>
          </tr>` : ""}
        </table>

        <p style="font-size:13px;color:#9e9b93;margin:20px 0 0;line-height:1.6;">
          Questions? Reply to this email and we'll get back to you right away.
        </p>
      </div>
    </div>`;

  try {
    await resend.emails.send({
      from:    `Selah by the Sea <${FROM_EMAIL}>`,
      to:      email,
      subject: `Your stay at Selah by the Sea is confirmed! 🌊`,
      html,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[approve-booking] email error:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
