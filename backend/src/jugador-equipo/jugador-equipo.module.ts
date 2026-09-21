import { Module } from '@nestjs/common';
import { JugadorEquipoController } from './jugador-equipo.controller.js';
import { JugadorEquipoService } from './jugador-equipo.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [JugadorEquipoController],
  providers: [JugadorEquipoService, PrismaService],
})
export class JugadorEquipoModule {}
