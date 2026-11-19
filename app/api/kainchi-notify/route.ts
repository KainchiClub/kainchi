import { NextResponse } from 'next/server'

const STUDIO_EMAIL = 'kainchiclub@gmail.com'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      eventType,
      customerName = 'Guest Member',
      customerEmail = '',
      customerPhone = '',
      orderSummary = '',
      orderTotal = 0,
      orderSequence = 1,
      giftAssigned = '',
      errorDetails = '',
    } = body

    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      return NextResponse.json({ ok: true, mode: 'logged-only-no-resend-key' })
    }

    const sendEmail = async (to: string, subject: string, html: string) => {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Kainchi Club Atelier <onboarding@resend.dev>',
          to: [to],
          subject,
          html,
        }),
      })
    }

    // 1. Always alert kainchiclub@gmail.com
    let adminSubject = `[Kainchi Club] Studio Event: ${eventType}`
    const adminHtml = `<div style="font-family:sans-serif;padding:20px;background:#faf7f2;color:#1c1614;">
      <h2 style="margin:0 0 12px;">Kainchi Club · Live Studio Alert</h2>
      <p><strong>Event:</strong> ${eventType}</p>
      <p><strong>Customer:</strong> ${customerName} (${customerEmail || 'No email'} | ${customerPhone || 'No phone'})</p>
      ${orderTotal ? `<p><strong>Order Value:</strong> ₹${orderTotal} (Order #0${orderSequence})</p>` : ''}
      ${giftAssigned ? `<p style="color:#8b1e24;"><strong>Non-Repeat Gift to Pack:</strong> ${giftAssigned}</p>` : ''}
      ${orderSummary ? `<pre style="background:#fff;padding:12px;border-radius:8px;">${orderSummary}</pre>` : ''}
      ${errorDetails ? `<p style="color:#b91c1c;"><strong>Error / Cart Details:</strong> ${errorDetails}</p>` : ''}
    </div>`

    if (eventType === 'signup') adminSubject = `✦ New Member Joined: ${customerName}`
    if (eventType === 'order_placed') adminSubject = `🛍️ Order #0${orderSequence} Placed by ${customerName} (₹${orderTotal})`
    if (eventType === 'abandoned_cart') adminSubject = `⚠️ Abandoned Cart Alert: ${customerName || customerEmail}`
    if (eventType === 'system_error') adminSubject = `🚨 Login/Checkout Error Alert`

    await sendEmail(STUDIO_EMAIL, adminSubject, adminHtml)

    // 2. Send Luxury Email to Customer if email exists
    if (customerEmail && customerEmail.includes('@')) {
      if (eventType === 'signup') {
        await sendEmail(
          customerEmail,
          'Welcome to Kainchi Club — Your Atelier Pass is Active',
          `<div style="font-family:Georgia,serif;max-width:560px;margin:auto;padding:32px;background:#181210;color:#f5efe6;border-radius:16px;">
            <p style="letter-spacing:0.22em;font-size:11px;color:#d4af37;text-transform:uppercase;">KAINCHI CLUB · WEAR YOUR OWN ART</p>
            <h1 style="font-weight:400;font-size:26px;margin:12px 0;">Welcome to the Club, ${customerName}.</h1>
            <p style="line-height:1.7;color:#dcd3c6;font-size:15px;">Your private studio account is now active. Every piece you order is crafted in small batches and unlocks a curated, non-repeating collector gift with each subsequent order.</p>
            <p style="margin-top:24px;font-size:13px;color:#a89b8c;">Crafted with intention · Kainchi Club Studio (${STUDIO_EMAIL})</p>
          </div>`
        )
      } else if (eventType === 'order_placed') {
        await sendEmail(
          customerEmail,
          `Order #0${orderSequence} Confirmed — Kainchi Club Studio`,
          `<div style="font-family:Georgia,serif;max-width:560px;margin:auto;padding:32px;background:#faf7f2;color:#181210;border:1px solid #e6dccf;border-radius:16px;">
            <p style="letter-spacing:0.2em;font-size:11px;color:#8b1e24;text-transform:uppercase;">KAINCHI CLUB · ATELIER RECEIPT</p>
            <h1 style="font-weight:400;font-size:24px;margin:12px 0;">Thank you, ${customerName}.</h1>
            <p style="line-height:1.6;font-size:15px;">We have received your <strong>Order #0${orderSequence}</strong> (Total: <strong>₹${orderTotal}</strong>). Each made-to-order piece is freshly crafted and dispatched within 5–7 business days.</p>
            <div style="margin:18px 0;padding:14px;background:#181210;color:#f5efe6;border-radius:10px;font-size:13px;">
              <strong>✦ Your Complimentary Member Gift Included:</strong><br/>${giftAssigned}
            </div>
            <p style="font-size:13px;color:#5c5046;">7 days after delivery, we will send a quick note to hear how your piece feels.</p>
          </div>`
        )
      } else if (eventType === 'feedback_request') {
        await sendEmail(
          customerEmail,
          'How does your Kainchi Club piece feel? (7-Day Atelier Check-in)',
          `<div style="font-family:Georgia,serif;max-width:560px;margin:auto;padding:32px;background:#181210;color:#f5efe6;border-radius:16px;">
            <p style="letter-spacing:0.2em;font-size:11px;color:#d4af37;text-transform:uppercase;">KAINCHI CLUB · STUDIO CHECK-IN</p>
            <h1 style="font-weight:400;font-size:24px;margin:12px 0;">A quick note from our studio, ${customerName}.</h1>
            <p style="line-height:1.7;color:#dcd3c6;font-size:15px;">It has been 7 days since your Kainchi Club piece arrived. Reply directly to this email (${STUDIO_EMAIL}) or leave a quick note on our storefront—your honest feedback shapes our next capsule drop.</p>
          </div>`
        )
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}
