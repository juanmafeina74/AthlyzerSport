import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProtocoloAntropometrico } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateEquipoDto } from './dto/create-equipo.dto.js';
import { UpdateEquipoDto } from './dto/update-equipo.dto.js';

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

  async create(data: CreateEquipoDto) {
    const requestedTemporada = data.id_temporada;
    const requestedCategoria = data.id_categoria;

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
        protocolo_antropometrico: data.protocolo_antropometrico ?? ProtocoloAntropometrico.BASICA,
        id_categoria: requestedCategoria ?? null,
        fecha_creacion: data.fecha_creacion
          ? new Date(data.fecha_creacion)
          : new Date(),
      },
    });
  }

  async update(id: number, data: UpdateEquipoDto) {
    const equipo = await this.findOne(id);

    const updateData: Prisma.equipoUncheckedUpdateInput = {};

    if (data.protocolo_antropometrico !== undefined) {
      updateData.protocolo_antropometrico = data.protocolo_antropometrico;
      if (data.protocolo_antropometrico !== equipo.protocolo_antropometrico) {
        updateData.version_protocolo_antropometrico = { increment: 1 };
      }
    }

    if (data.id_temporada !== undefined) {
      updateData.id_temporada = data.id_temporada;
    }

    if (data.nombre !== undefined) {
      updateData.nombre = data.nombre;
    }

    if (data.id_categoria !== undefined) {
      const requestedCategoria = data.id_categoria ?? null;

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

    try {
      return await this.prisma.equipo.update({
        where: {
          id_equipo: id,
          ...(data.protocolo_antropometrico !== undefined
            ? { version_protocolo_antropometrico: equipo.version_protocolo_antropometrico }
            : {}),
        },
        data: updateData,
        include: { categoria: true },
      });
    } catch (error) {
      if (data.protocolo_antropometrico !== undefined &&
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new ConflictException('La configuración del equipo ha cambiado. Recarga los datos e inténtalo de nuevo.');
      }
      throw error;
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    throw new ConflictException('No se permite el borrado físico de equipos. Se conservan sus vínculos históricos.');
  }
}
