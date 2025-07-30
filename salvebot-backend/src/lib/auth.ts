import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { User } from '../types'

export class AuthService {
  private jwtSecret: Uint8Array

  constructor(secret: string) {
    this.jwtSecret = new TextEncoder().encode(secret)
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
  }

  async generateToken(user: Pick<User, 'id' | 'email'>): Promise<string> {
    return new SignJWT({ sub: user.id, email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(this.jwtSecret)
  }

  async verifyToken(token: string): Promise<{ sub: string; email: string } | null> {
    try {
      const { payload } = await jwtVerify(token, this.jwtSecret)
      return {
        sub: payload.sub as string,
        email: payload.email as string
      }
    } catch {
      return null
    }
  }

  extractBearerToken(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }
    return authHeader.substring(7)
  }
}