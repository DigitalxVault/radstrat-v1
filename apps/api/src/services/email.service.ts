import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const EMAIL_FROM = process.env.EMAIL_FROM || 'RADSTRAT <noreply@radstrat.devsparksbuild.com>'

export async function sendPasswordResetEmail(
  to: string,
  temporaryPassword: string,
  userName: string,
): Promise<void> {
  if (!resend) {
    console.warn('[Email] RESEND_API_KEY not configured — skipping password reset email')
    return
  }

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: 'RADSTRAT - Your Password Has Been Reset',
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color: #1a1a2e; padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: 2px;">RADSTRAT</h1>
              <p style="margin: 4px 0 0; color: #8b8ba3; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Training Management System</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.5;">Hello ${userName},</p>
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.5;">Your password has been reset by an administrator. Please use the temporary password below to log in.</p>
              <!-- Password Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px;">
                <tr>
                  <td style="background-color: #f0fdf4; border: 2px solid #16a34a; border-radius: 8px; padding: 20px; text-align: center;">
                    <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Temporary Password</p>
                    <p style="margin: 0; color: #1a1a2e; font-size: 24px; font-weight: 700; font-family: 'Courier New', monospace; letter-spacing: 2px;">${temporaryPassword}</p>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.5; font-weight: 600;">You will be required to change this password on your next login.</p>
              <!-- Security Notice -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 0 4px 4px 0; padding: 16px 20px;">
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                      <strong>Security Notice:</strong> If you did not request this change, contact your system administrator immediately.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">This is an automated message from RADSTRAT. Do not reply to this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    })
    console.log(`[Email] Password reset email sent to ${to}`)
  } catch (error) {
    console.error('[Email] Failed to send password reset email:', error)
    // Don't throw — email failure shouldn't block the reset
  }
}
