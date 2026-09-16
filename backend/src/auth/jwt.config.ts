import { JwtSignOptions } from '@nestjs/jwt';

const DEV_JWT_SECRET = 'athlyzer-dev-secret-change-me';

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET?.trim();

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET es obligatorio en producción.');
  }

  return DEV_JWT_SECRET;
}

export function getJwtExpiresIn(): JwtSignOptions['expiresIn'] {
  return (process.env.JWT_EXPIRES_IN?.trim() || '8h') as JwtSignOptions['expiresIn'];
}
