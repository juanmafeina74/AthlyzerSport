import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsuariosController } from './usuarios.controller.js';
import { UsuariosService } from './usuarios.service.js';

@Module({
  imports: [AuthModule],
  controllers: [UsuariosController],
  providers: [UsuariosService, PrismaService],
})
export class UsuariosModule {}
