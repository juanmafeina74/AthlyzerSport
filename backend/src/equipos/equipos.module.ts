import { Module } from '@nestjs/common';
import { EquiposController } from './equipos.controller.js';
import { EquiposService } from './equipos.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [EquiposController],
  providers: [EquiposService, PrismaService],
})
export class EquiposModule {}
