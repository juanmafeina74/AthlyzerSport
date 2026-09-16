import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class EquiposService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.equipo.findMany({
      orderBy: { id_equipo: 'asc' },
    });
  }

  async findOne(id: number) {
    const equipo = await this.prisma.equipo.findUnique({ where: { id_equipo: id } });
    if (!equipo) {
      throw new NotFoundException(`Equipo ${id} no encontrado`);
    }
    return equipo;
  }

  async create(data: any) {
    const requestedTemporada = data.id_temporada ? Number(data.id_temporada) : undefined;

    if (!requestedTemporada) {
      throw new BadRequestException(
        'Debe seleccionar una temporada válida antes de crear el equipo.',
      );
    }

    const temporada = await this.prisma.temporada.findUnique({
      where: { id_temporada: requestedTemporada },
    });

    if (!temporada) {
      throw new BadRequestException(
        `La temporada ${requestedTemporada} no existe y el equipo no puede persistirse.`,
      );
    }

    return this.prisma.equipo.create({
      data: {
        id_temporada: requestedTemporada,
        nombre: data.nombre,
        categoria: data.categoria ?? null,
        fecha_creacion: data.fecha_creacion
          ? new Date(data.fecha_creacion)
          : new Date(),
      },
    });
  }

  async update(id: number, data: any) {
    await this.findOne(id);

    return this.prisma.equipo.update({
      where: { id_equipo: id },
      data: {
        id_temporada: data.id_temporada ?? undefined,
        nombre: data.nombre,
        categoria: data.categoria ?? null,
        fecha_creacion: data.fecha_creacion
          ? new Date(data.fecha_creacion)
          : undefined,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.equipo.delete({ where: { id_equipo: id } });
  }
}
