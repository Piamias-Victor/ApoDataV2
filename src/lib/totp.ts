// src/lib/totp.ts
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

authenticator.options = {
  window: 1, // Tolérance ±30s
  step: 30
};

export const generateSecret = (): string => {
  return authenticator.generateSecret();
};

export const generateQRCode = async (
  email: string,
  secret: string
): Promise<string> => {
  const otpauth = authenticator.keyuri(
    email,
    'ApoData Genesis',
    secret
  );
  
  return QRCode.toDataURL(otpauth);
};

export const verifyToken = (token: string, secret: string): boolean => {
  try {
    return authenticator.verify({ token, secret });
  } catch {
    return false;
  }
};