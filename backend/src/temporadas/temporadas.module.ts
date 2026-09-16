import { Module } from '@nestjs/common';
import { TemporadasController } from './temporadas.controller.js';
import { TemporadasService } from './temporadas.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [TemporadasController],
  providers: [TemporadasService, PrismaService],
})
export class TemporadasModule {}
