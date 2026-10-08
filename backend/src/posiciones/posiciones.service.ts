import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePosicionDto } from './dto/create-posicion.dto.js';
import { UpdatePosicionDto } from './dto/update-posicion.dto.js';

@Injectable()
export class PosicionesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.posicion.findMany({ orderBy: { nombre: 'asc' } });
  }

  create(data: CreatePosicionDto) {
    return this.prisma.posicion.create({
      data: { nombre: this.normalizeName(data.nombre), abreviatura: data.abreviatura?.trim() || null },
    });
  }

  async update(id: number, data: UpdatePosicionDto) {
    await this.ensurePositionExists(id);
    return this.prisma.posicion.update({
      where: { id_posicion: id },
      data: {
        nombre: data.nombre === undefined ? undefined : this.normalizeName(data.nombre),
        abreviatura: data.abreviatura === undefined ? undefined : data.abreviatura?.trim() || null,
      },
    });
  }

  async remove(id: number) {
    await this.ensurePositionExists(id);
    try {
      return await this.prisma.posicion.delete({ where: { id_posicion: id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new ConflictException('No se puede eliminar una posición asignada a jugadores o equipos.');
      }
      throw error;
    }
  }

  private async ensurePositionExists(id: number) {
    const position = await this.prisma.posicion.findUnique({ where: { id_posicion: id } });
    if (!position) {
      throw new NotFoundException(`Posición ${id} no encontrada`);
    }
  }

  private normalizeName(value: string) {
    const normalized = value.trim();
    if (!normalized) {
      throw new BadRequestException('El nombre de la posición es obligatorio.');
    }
    return normalized;
  }
}