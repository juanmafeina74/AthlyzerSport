import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCategoriaDto } from './dto/create-categoria.dto.js';
import { UpdateCategoriaDto } from './dto/update-categoria.dto.js';

@Injectable()
export class CategoriasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.categoria.findMany({ orderBy: { nombre: 'asc' } });
  }

  async findActive() {
    return this.prisma.categoria.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: number) {
    const categoria = await this.prisma.categoria.findUnique({ where: { id_categoria: id } });

    if (!categoria) {
      throw new NotFoundException(`Categoría ${id} no encontrada`);
    }

    return categoria;
  }

  async create(data: CreateCategoriaDto) {
    return this.prisma.categoria.create({
      data: {
        nombre: data.nombre.trim(),
        activo: data.activo !== false,
      },
    });
  }

  async update(id: number, data: UpdateCategoriaDto) {
    await this.findOne(id);

    const updateData: Prisma.categoriaUpdateInput = {};

    if (data.nombre !== undefined) {
      updateData.nombre = data.nombre.trim();
    }

    if (data.activo !== undefined) {
      updateData.activo = data.activo;
    }

    return this.prisma.categoria.update({ where: { id_categoria: id }, data: updateData });
  }

  async remove(id: number) {
    const categoria = await this.prisma.categoria.findUnique({
      where: { id_categoria: id },
      include: { _count: { select: { equipos: true } } },
    });

    if (!categoria) {
      throw new NotFoundException(`Categoría ${id} no encontrada`);
    }

    if (categoria._count.equipos > 0) {
      throw new BadRequestException('No se puede eliminar una categoría asignada a equipos.');
    }

    await this.prisma.categoria.delete({ where: { id_categoria: id } });
    return { deleted: true };
  }
}
