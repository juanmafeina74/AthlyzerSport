import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTemporadaDto } from './dto/create-temporada.dto.js';
import { UpdateTemporadaDto } from './dto/update-temporada.dto.js';

@Injectable()
export class TemporadasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.temporada.findMany({
      orderBy: { id_temporada: 'asc' },
    });
  }

  async findOne(id: number) {
    const temporada = await this.prisma.temporada.findUnique({
      where: { id_temporada: id },
    });

    if (!temporada) {
      throw new NotFoundException(`Temporada ${id} no encontrada`);
    }

    return temporada;
  }

  async create(data: CreateTemporadaDto) {
    const fechaInicio = new Date(data.fecha_inicio);
    const fechaFin = new Date(data.fecha_fin);

    if (Number.isNaN(fechaInicio.getTime()) || Number.isNaN(fechaFin.getTime())) {
      throw new BadRequestException('Las fechas de la temporada deben ser válidas.');
    }

    if (fechaFin < fechaInicio) {
      throw new BadRequestException('La fecha de fin no puede ser anterior a la fecha de inicio.');
    }

    return this.prisma.temporada.create({
      data: {
        nombre: data.nombre.trim(),
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        estado: data.estado ?? 'activa',
      },
    });
  }

  async update(id: number, data: UpdateTemporadaDto) {
    await this.findOne(id);

    const updateData: { nombre?: string; fecha_inicio?: Date; fecha_fin?: Date; estado?: string } = {};

    if (data.nombre !== undefined) {
      updateData.nombre = data.nombre.trim();
    }

    if (data.fecha_inicio !== undefined) {
      updateData.fecha_inicio = new Date(data.fecha_inicio);
    }

    if (data.fecha_fin !== undefined) {
      updateData.fecha_fin = new Date(data.fecha_fin);
    }

    if (data.estado !== undefined) {
      updateData.estado = data.estado;
    }

    return this.prisma.temporada.update({
      where: { id_temporada: id },
      data: updateData,
    });
  }

  async remove(id: number) {
    const temporada = await this.prisma.temporada.findUnique({
      where: { id_temporada: id },
      include: { _count: { select: { equipo: true } } },
    });

    if (!temporada) {
      throw new NotFoundException(`Temporada ${id} no encontrada`);
    }

    if (temporada._count.equipo > 0) {
      throw new BadRequestException(
        'No se puede eliminar una temporada con equipos asociados. Elimina o reasigna primero sus equipos.',
      );
    }

    return this.prisma.temporada.delete({ where: { id_temporada: id } });
  }
}
