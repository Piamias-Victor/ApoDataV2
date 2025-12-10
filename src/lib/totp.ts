// src/lib/totp.ts
import { authenticator } from 'otplib';

export const generateSecret = () => {
    return authenticator.generateSecret();
};

export const generateToken = (secret: string) => {
    return authenticator.generate(secret);
};

export const verifyToken = (token: string, secret: string) => {
    try {
        return authenticator.check(token, secret);
    } catch (err) {
        console.error('Error verifying token:', err);
        return false;
    }
};
