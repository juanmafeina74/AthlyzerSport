import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PosicionesController } from './posiciones.controller.js';
import { PosicionesService } from './posiciones.service.js';

@Module({
  imports: [AuthModule],
  controllers: [PosicionesController],
  providers: [PosicionesService, PrismaService],
})
export class PosicionesModule {}