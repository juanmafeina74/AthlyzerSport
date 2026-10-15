import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class JugadorEquipoService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureEquipoExists(idEquipo: number) {
    const equipo = await this.prisma.equipo.findUnique({ where: { id_equipo: idEquipo } });

    if (!equipo) {
      throw new NotFoundException(`Equipo ${idEquipo} no encontrado`);
    }
  }

  private async ensurePositionExists(idPosicion: number) {
    const position = await this.prisma.posicion.findUnique({ where: { id_posicion: idPosicion } });
    if (!position) {
      throw new BadRequestException(`La posición ${idPosicion} no existe.`);
    }
  }

  async findDisponibles(idEquipo: number, search?: string) {
    await this.ensureEquipoExists(idEquipo);

    const texto = search?.trim();

    return this.prisma.jugador.findMany({
      where: {
        NOT: { jugador_equipo: { some: { id_equipo: idEquipo, activo: true } } },
        ...(texto
          ? {
              OR: [
                { nombre: { contains: texto, mode: 'insensitive' } },
                { apellidos: { contains: texto, mode: 'insensitive' } },
                { dni: { contains: texto, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [{ apellidos: 'asc' }, { nombre: 'asc' }],
    });
  }

  async findPlantilla(idEquipo: number) {
    await this.ensureEquipoExists(idEquipo);

    const jugadorEquipo = await this.prisma.jugador_equipo.findMany({
      where: { id_equipo: idEquipo, activo: true },
      include: { jugador: { include: { posicion_preferida: true } }, posicion: true },
      orderBy: [{ dorsal: 'asc' }],
    });

    return jugadorEquipo.map((je) => ({
      id_jugador_equipo: je.id_jugador_equipo,
      id_jugador: je.id_jugador,
      dorsal: je.dorsal,
      posicion: je.posicion,
      fecha_inicio: je.fecha_inicio,
      jugador: je.jugador,
    }));
  }

  async assign(idEquipo: number, idJugador: number, dorsal?: number, idPosicion?: number | null) {
    await this.ensureEquipoExists(idEquipo);

    if (idPosicion != null) {
      await this.ensurePositionExists(idPosicion);
    }

    const jugador = await this.prisma.jugador.findUnique({ where: { id_jugador: idJugador } });

    if (!jugador) {
      throw new BadRequestException(`El jugador ${idJugador} no existe.`);
    }

    const existente = await this.prisma.jugador_equipo.findFirst({
      where: { id_equipo: idEquipo, id_jugador: idJugador },
    });

    if (existente) {
      if (existente.activo) {
        if (dorsal === undefined && idPosicion === undefined) {
          return existente;
        }
        return this.prisma.jugador_equipo.update({
          where: { id_jugador_equipo: existente.id_jugador_equipo },
          data: {
            dorsal,
            ...(idPosicion !== undefined ? { id_posicion: idPosicion } : {}),
          },
          include: { posicion: true },
        });
      }

      return this.prisma.jugador_equipo.update({
        where: { id_jugador_equipo: existente.id_jugador_equipo },
        data: {
          activo: true,
          fecha_inicio: new Date(),
          fecha_fin: null,
          dorsal: dorsal ?? existente.dorsal,
          id_posicion: idPosicion !== undefined ? idPosicion : existente.id_posicion,
        },
        include: { posicion: true },
      });
    }

    return this.prisma.jugador_equipo.create({
      data: {
        id_equipo: idEquipo,
        id_jugador: idJugador,
        id_posicion: idPosicion ?? null,
        fecha_inicio: new Date(),
        dorsal: dorsal ?? null,
        activo: true,
      },
    });
  }

  async updatePosition(idEquipo: number, idJugador: number, idPosicion: number | null) {
    await this.ensureEquipoExists(idEquipo);
    if (idPosicion != null) {
      await this.ensurePositionExists(idPosicion);
    }

    const membership = await this.prisma.jugador_equipo.findFirst({
      where: { id_equipo: idEquipo, id_jugador: idJugador, activo: true },
    });
    if (!membership) {
      throw new NotFoundException(`El jugador ${idJugador} no está activo en el equipo ${idEquipo}.`);
    }

    return this.prisma.jugador_equipo.update({
      where: { id_jugador_equipo: membership.id_jugador_equipo },
      data: { id_posicion: idPosicion },
      include: { posicion: true },
    });
  }

  async bulkAssign(idEquipo: number, idJugadores: number[]) {
    const resultados = [];

    for (const idJugador of idJugadores) {
      resultados.push(await this.assign(idEquipo, idJugador));
    }

    return resultados;
  }

  async remove(idEquipo: number, idJugador: number) {
    await this.ensureEquipoExists(idEquipo);

    const existente = await this.prisma.jugador_equipo.findFirst({
      where: { id_equipo: idEquipo, id_jugador: idJugador, activo: true },
    });

    if (!existente) {
      throw new NotFoundException(
        `El jugador ${idJugador} no está en la plantilla del equipo ${idEquipo}.`,
      );
    }

    return this.prisma.jugador_equipo.update({
      where: { id_jugador_equipo: existente.id_jugador_equipo },
      data: { activo: false, fecha_fin: new Date() },
    });
  }

  async bulkRemove(idEquipo: number, idJugadores: number[]) {
    const resultados = [];

    for (const idJugador of idJugadores) {
      resultados.push(await this.remove(idEquipo, idJugador));
    }

    return resultados;
  }
}
