import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class EquiposService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.equipo.findMany({
      include: { categoria: true },
      orderBy: { id_equipo: 'asc' },
    });
  }

  async findOne(id: number) {
    const equipo = await this.prisma.equipo.findUnique({
      where: { id_equipo: id },
      include: { categoria: true },
    });
    if (!equipo) {
      throw new NotFoundException(`Equipo ${id} no encontrado`);
    }
    return equipo;
  }

  async create(data: any) {
    const requestedTemporada = data.id_temporada ? Number(data.id_temporada) : undefined;
    const requestedCategoria = data.id_categoria ? Number(data.id_categoria) : undefined;

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

    if (requestedCategoria) {
      const categoria = await this.prisma.categoria.findFirst({
        where: { id_categoria: requestedCategoria, activo: true },
      });

      if (!categoria) {
        throw new BadRequestException('La categoría seleccionada no existe o está inactiva.');
      }
    }

    return this.prisma.equipo.create({
      data: {
        id_temporada: requestedTemporada,
        nombre: data.nombre,
        id_categoria: requestedCategoria ?? null,
        fecha_creacion: data.fecha_creacion
          ? new Date(data.fecha_creacion)
          : new Date(),
      },
    });
  }

  async update(id: number, data: any) {
    await this.findOne(id);

    const updateData: any = {};

    if (data.id_temporada !== undefined) {
      updateData.id_temporada = Number(data.id_temporada);
    }

    if (data.nombre !== undefined) {
      updateData.nombre = data.nombre;
    }

    if (data.id_categoria !== undefined) {
      const requestedCategoria = data.id_categoria ? Number(data.id_categoria) : null;

      if (requestedCategoria) {
        const categoria = await this.prisma.categoria.findFirst({
          where: { id_categoria: requestedCategoria, activo: true },
        });

        if (!categoria) {
          throw new BadRequestException('La categoría seleccionada no existe o está inactiva.');
        }
      }

      updateData.id_categoria = requestedCategoria;
    }

    if (data.fecha_creacion !== undefined) {
      updateData.fecha_creacion = new Date(data.fecha_creacion);
    }

    return this.prisma.equipo.update({
      where: { id_equipo: id },
      data: updateData,
      include: { categoria: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.equipo.delete({ where: { id_equipo: id } });
  }
}
