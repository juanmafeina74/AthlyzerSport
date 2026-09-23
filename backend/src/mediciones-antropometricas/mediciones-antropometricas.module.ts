import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { MedicionesAntropometricasController } from './mediciones-antropometricas.controller.js';
import { MedicionesAntropometricasService } from './mediciones-antropometricas.service.js';

@Module({
  imports: [AuthModule],
  controllers: [MedicionesAntropometricasController],
  providers: [MedicionesAntropometricasService, PrismaService],
})
export class MedicionesAntropometricasModule {}