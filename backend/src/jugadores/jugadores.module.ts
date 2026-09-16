import { Module } from '@nestjs/common';
import { JugadoresController } from './jugadores.controller.js';
import { JugadoresService } from './jugadores.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [JugadoresController],
  providers: [JugadoresService, PrismaService],
})
export class JugadoresModule {}
