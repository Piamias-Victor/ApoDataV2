// src/lib/email.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetLink = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

  await transporter.sendMail({
    from: '"ApoData Security" <no-reply@apodata.fr>',
    to: email,
    subject: 'Réinitialisation de votre mot de passe',
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Réinitialisation de mot de passe</h2>
        <p>Vous avez demandé à réinitialiser votre mot de passe ApoData.</p>
        <p>Cliquez sur le lien ci-dessous pour procéder :</p>
        <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0;">
          Réinitialiser mon mot de passe
        </a>
        <p>Ce lien expirera dans 1 heure.</p>
        <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
      </div>
    `,
  });
};

export const sendInvitationEmail = async (email: string, token: string, name: string) => {
  // We reuse the reset-password page for setting the initial password
  const inviteLink = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

  await transporter.sendMail({
    from: '"ApoData Security" <no-reply@apodata.fr>',
    to: email,
    subject: 'Bienvenue sur ApoData - Finalisez votre compte',
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Bienvenue ${name} !</h2>
        <p>Un compte administrateur vous a invité à rejoindre la plateforme ApoData.</p>
        <p>Pour finaliser votre inscription et définir votre mot de passe, cliquez sur le lien ci-dessous :</p>
        <a href="${inviteLink}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0;">
          Activer mon compte
        </a>
        <p>Ce lien expirera dans 24 heures.</p>
        <p>Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet email.</p>
      </div>
    `,
  });
};
