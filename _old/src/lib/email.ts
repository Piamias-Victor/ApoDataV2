// src/lib/email.ts
import nodemailer from 'nodemailer';

interface EmailOptions {
  readonly to: string;
  readonly subject: string;
  readonly html: string;
}

interface ResetPasswordEmailData {
  readonly userName: string;
  readonly resetUrl: string;
  readonly expiresAt: string;
}

/**
 * Service d'envoi d'emails avec Nodemailer
 * Support SMTP Gmail, Outlook, ou serveur personnalisé
 */
class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    const {
      SMTP_HOST,
      SMTP_PORT,
      SMTP_SECURE,
      SMTP_USER,
      SMTP_PASS,
      EMAIL_FROM
    } = process.env;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !EMAIL_FROM) {
      console.warn('⚠️ [EMAIL] Variables SMTP non configurées. Emails désactivés.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT || '587'),
        secure: SMTP_SECURE === 'true',
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS
        },
        // Configuration supplémentaire pour Gmail
        ...(SMTP_HOST.includes('gmail') && {
          service: 'gmail',
          auth: {
            user: SMTP_USER,
            pass: SMTP_PASS
          }
        })
      });

      console.log('✅ [EMAIL] Transporter SMTP initialisé avec succès');
    } catch (error) {
      console.error('❌ [EMAIL] Erreur initialisation transporter:', error);
    }
  }

  async sendEmail({ to, subject, html }: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      console.error('❌ [EMAIL] Transporter non initialisé');
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"ApoData" <${process.env.EMAIL_FROM}>`,
        to,
        subject,
        html
      });

      console.log('✅ [EMAIL] Email envoyé:', {
        to,
        subject,
        messageId: info.messageId
      });

      return true;
    } catch (error) {
      console.error('❌ [EMAIL] Erreur envoi:', error);
      return false;
    }
  }

  async sendResetPasswordEmail(
    email: string, 
    data: ResetPasswordEmailData
  ): Promise<boolean> {
    const subject = 'ApoData - Réinitialisation de votre mot de passe';
    
    const html = this.generateResetPasswordTemplate(data);
    
    return this.sendEmail({
      to: email,
      subject,
      html
    });
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✅ [EMAIL] Connexion SMTP vérifiée');
      return true;
    } catch (error) {
      console.error('❌ [EMAIL] Erreur connexion SMTP:', error);
      return false;
    }
  }

  private generateResetPasswordTemplate({
    userName,
    resetUrl,
    expiresAt
  }: ResetPasswordEmailData): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Réinitialisation mot de passe - ApoData</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #F9FAFB; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%); color: white; padding: 40px 30px; text-align: center; }
        .content { padding: 40px 30px; }
        .footer { background: #F9FAFB; padding: 30px; text-align: center; color: #6B7280; font-size: 14px; border-top: 1px solid #E5E7EB; }
        .button { display: inline-block; background: #3B82F6; color: white !important; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; transition: background 0.2s; }
        .button:hover { background: #2563EB; }
        .warning { background: #FEF3C7; color: #92400E; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #F59E0B; }
        .security { background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 25px 0; font-size: 14px; color: #6B7280; }
        .url-box { background: #F3F4F6; padding: 15px; border-radius: 6px; word-break: break-all; font-family: 'Monaco', 'Menlo', monospace; font-size: 13px; color: #374151; margin: 15px 0; }
        h1 { margin: 0; font-size: 28px; font-weight: 700; }
        h2 { color: #1F2937; font-size: 24px; margin: 0 0 20px 0; }
        p { margin: 15px 0; color: #374151; }
        ul { margin: 10px 0; padding-left: 20px; }
        li { margin: 5px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏥 ApoData</h1>
          <p style="margin: 15px 0 0 0; opacity: 0.9; font-size: 18px;">Réinitialisation de votre mot de passe</p>
        </div>
        
        <div class="content">
          <h2>Bonjour ${userName},</h2>
          
          <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte ApoData.</p>
          
          <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe sécurisé :</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" class="button">🔐 Réinitialiser mon mot de passe</a>
          </div>
          
          <div class="warning">
            <strong>⏱️ Attention :</strong> Ce lien expire le <strong>${expiresAt}</strong> (dans 1 heure).
          </div>
          
          <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
          <div class="url-box">${resetUrl}</div>
          
          <div class="security">
            <strong>🔐 Mesures de sécurité :</strong>
            <ul style="margin: 15px 0 0 0;">
              <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
              <li>Ne partagez jamais ce lien avec personne</li>
              <li>Votre mot de passe actuel reste inchangé jusqu'à la réinitialisation</li>
              <li>Ce lien ne peut être utilisé qu'une seule fois</li>
            </ul>
          </div>
        </div>
        
        <div class="footer">
          <p>
            <strong>ApoData</strong><br>
            Dashboard pharmaceutique sécurisé
          </p>
          <p style="margin-top: 20px; font-size: 12px; color: #9CA3AF;">
            © ${new Date().getFullYear()} ApoData - Tous droits réservés<br>
            ✅ Conforme GDPR • 🔒 Données chiffrées • 📋 Audit trails<br>
            <em>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</em>
          </p>
        </div>
      </div>
    </body>
    </html>
    `;
  }
}

export const emailService = new EmailService();