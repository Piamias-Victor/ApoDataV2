// src/types/totp.ts
export interface TwoFactorSetup {
  readonly secret: string;
  readonly qrCode: string;
}

export interface TwoFactorVerification {
  readonly token: string;
  readonly email: string;
}