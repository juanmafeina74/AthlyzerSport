import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { LesionesController } from './lesiones.controller.js';
import { LesionesService } from './lesiones.service.js';

@Module({
  imports: [AuthModule],
  controllers: [LesionesController],
  providers: [LesionesService, PrismaService],
})
export class LesionesModule {}