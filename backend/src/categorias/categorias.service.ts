import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

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

  async create(data: any) {
    const nombre = this.getNombre(data.nombre);

    return this.prisma.categoria.create({
      data: {
        nombre,
        activo: data.activo !== false,
      },
    });
  }

  async update(id: number, data: any) {
    await this.findOne(id);

    const updateData: { nombre?: string; activo?: boolean } = {};

    if (data.nombre !== undefined) {
      updateData.nombre = this.getNombre(data.nombre);
    }

    if (data.activo !== undefined) {
      updateData.activo = Boolean(data.activo);
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

  private getNombre(value: unknown) {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException('El nombre de la categoría es obligatorio.');
    }

    return value.trim();
  }
}
