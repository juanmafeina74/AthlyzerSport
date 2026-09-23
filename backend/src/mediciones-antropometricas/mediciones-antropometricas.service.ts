import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { calculateAnthropometricResults } from './antropometria.calculator.js';
import { CreateMedicionAntropometricaDto } from './dto/create-medicion-antropometrica.dto.js';

@Injectable()
export class MedicionesAntropometricasService {
  constructor(private readonly prisma: PrismaService) {}

  async findByPlayer(idJugador: number) {
    await this.ensurePlayerExists(idJugador);

    return this.prisma.medicion_antropometrica.findMany({
      where: { id_jugador: idJugador },
      include: {
        evaluador: { select: { id_usuario: true, nombre: true } },
      },
      orderBy: [{ fecha: 'desc' }, { id_medicion: 'desc' }],
    });
  }

  async create(data: CreateMedicionAntropometricaDto, idEvaluador: number) {
    await this.ensurePlayerExists(data.id_jugador);
    const { fecha, ...measurements } = data;
    const calculated = calculateAnthropometricResults(measurements);
    const createData: Prisma.medicion_antropometricaUncheckedCreateInput = {
      ...measurements,
      ...calculated,
      id_evaluador: idEvaluador,
      fecha: fecha ? new Date(fecha) : new Date(),
    };

    return this.prisma.medicion_antropometrica.create({
      data: createData,
      include: {
        jugador: { select: { id_jugador: true, nombre: true, apellidos: true } },
        evaluador: { select: { id_usuario: true, nombre: true } },
      },
    });
  }

  private async ensurePlayerExists(idJugador: number) {
    const player = await this.prisma.jugador.findUnique({
      where: { id_jugador: idJugador },
      select: { id_jugador: true },
    });

    if (!player) {
      throw new NotFoundException(`Jugador ${idJugador} no encontrado`);
    }
  }
}