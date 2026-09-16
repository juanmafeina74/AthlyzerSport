import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class JugadoresService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.jugador.findMany({
      orderBy: { id_jugador: 'asc' },
    });
  }

  async findOne(id: number) {
    const jugador = await this.prisma.jugador.findUnique({ where: { id_jugador: id } });
    if (!jugador) {
      throw new NotFoundException(`Jugador ${id} no encontrado`);
    }
    return jugador;
  }

  async create(data: any) {
    return this.prisma.jugador.create({
      data: {
        dni: data.dni,
        nombre: data.nombre,
        apellidos: data.apellidos,
        fecha_nacimiento: data.fecha_nacimiento
          ? new Date(data.fecha_nacimiento)
          : new Date(),
        foto: data.foto ?? null,
      },
    });
  }

  async update(id: number, data: any) {
    await this.findOne(id);

    return this.prisma.jugador.update({
      where: { id_jugador: id },
      data: {
        dni: data.dni,
        nombre: data.nombre,
        apellidos: data.apellidos,
        fecha_nacimiento: data.fecha_nacimiento
          ? new Date(data.fecha_nacimiento)
          : undefined,
        foto: data.foto ?? null,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.jugador.delete({ where: { id_jugador: id } });
  }
}
