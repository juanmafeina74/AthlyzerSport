import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

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

  async create(data: any) {
    if (!data.nombre || !data.nombre.trim()) {
      throw new BadRequestException('El nombre de la temporada es obligatorio.');
    }

    if (!data.fecha_inicio) {
      throw new BadRequestException('La fecha de inicio es obligatoria.');
    }

    if (!data.fecha_fin) {
      throw new BadRequestException('La fecha de fin es obligatoria.');
    }

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

  async update(id: number, data: any) {
    await this.findOne(id);

    const updateData: any = {};

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
    await this.findOne(id);
    return this.prisma.temporada.delete({ where: { id_temporada: id } });
  }
}
