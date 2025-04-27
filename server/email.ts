import { MailService } from '@sendgrid/mail';

// Setup mail service if SendGrid API key is available
let mailService: MailService | null = null;

// Try to initialize SendGrid mail service
try {
  if (process.env.SENDGRID_API_KEY) {
    mailService = new MailService();
    mailService.setApiKey(process.env.SENDGRID_API_KEY);
    console.log("SendGrid mail service initialized");
  } else {
    console.warn("SENDGRID_API_KEY not found in environment variables. Email functionality will be disabled.");
  }
} catch (error) {
  console.error("Failed to initialize SendGrid mail service:", error);
  mailService = null;
}

interface EmailParams {
  to: string;
  from?: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!mailService) {
    console.warn("Email service not initialized. Email not sent to:", params.to);
    return false;
  }

  const emailData = {
    to: params.to,
    from: params.from || 'support@idlecash.com', // Default sender
    subject: params.subject,
    text: params.text || '',
    html: params.html || ''
  };

  try {
    await mailService.send(emailData);
    console.log("Email sent successfully to:", params.to);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export function sendSupportTicketConfirmation(
  email: string, 
  name: string, 
  ticketId: number, 
  subject: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">Support Ticket Confirmation</h2>
      <p>Hello ${name},</p>
      <p>Thank you for contacting our support team. We have received your request and will respond as soon as possible.</p>
      <div style="background-color: #f7f7f7; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Ticket ID:</strong> #${ticketId}</p>
        <p style="margin: 5px 0;"><strong>Subject:</strong> ${subject}</p>
      </div>
      <p>We typically respond to support requests within 24-48 hours during business days.</p>
      <p>Best regards,<br/>The IdleCash Support Team</p>
    </div>
  `;

  return sendEmail({
    to: email,
    from: 'support@idlecash.com',
    subject: `Support Ticket Confirmation: ${subject}`,
    html,
  });
}

export function sendTicketResponseNotification(
  email: string,
  name: string,
  ticketId: number,
  subject: string,
  response: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">Support Ticket Update</h2>
      <p>Hello ${name},</p>
      <p>We have responded to your support ticket regarding "${subject}".</p>
      <div style="background-color: #f7f7f7; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Ticket ID:</strong> #${ticketId}</p>
        <p style="margin: 5px 0;"><strong>Response:</strong></p>
        <div style="padding: 10px; background-color: white; border-radius: 3px;">
          ${response.replace(/\n/g, '<br/>')}
        </div>
      </div>
      <p>If you have any further questions, you can reply to this email or create a new support ticket.</p>
      <p>Best regards,<br/>The IdleCash Support Team</p>
    </div>
  `;

  return sendEmail({
    to: email,
    from: 'support@idlecash.com',
    subject: `Response to Your Support Ticket: ${subject}`,
    html,
  });
}