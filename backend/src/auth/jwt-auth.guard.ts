import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { getJwtSecret } from './jwt.config.js';
import { JwtUser } from './auth.types.js';

type AuthenticatedRequest = Request & { user?: JwtUser };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('Token de autenticación requerido.');
    }

    try {
      request.user = await this.jwtService.verifyAsync<JwtUser>(token, {
        secret: getJwtSecret(),
      });
      return true;
    } catch {
      throw new UnauthorizedException('Token de autenticación no válido.');
    }
  }

  private extractBearerToken(request: Request) {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
