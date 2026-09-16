import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { getJwtExpiresIn, getJwtSecret } from './jwt.config.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    if (!email || !email.trim()) {
      throw new BadRequestException('El email es obligatorio.');
    }

    if (!password || !password.trim()) {
      throw new BadRequestException('La contraseña es obligatoria.');
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { rol: true },
    });

    if (!usuario) {
      throw new NotFoundException('Credenciales no válidas.');
    }

    if (!usuario.activo) {
      throw new BadRequestException('El usuario está inactivo.');
    }

    const passwordMatches = await bcrypt.compare(password.trim(), usuario.password_hash);

    if (!passwordMatches) {
      throw new BadRequestException('Credenciales no válidas.');
    }

    const user = {
      id_usuario: usuario.id_usuario,
      nombre: usuario.nombre,
      email: usuario.email,
      role: usuario.rol.nombre,
      activo: usuario.activo,
    };

    return {
      ...user,
      accessToken: await this.jwtService.signAsync(
        {
          id_usuario: user.id_usuario,
          email: user.email,
          role: user.role,
        },
        {
          secret: getJwtSecret(),
          expiresIn: getJwtExpiresIn(),
        },
      ),
    };
  }
}
