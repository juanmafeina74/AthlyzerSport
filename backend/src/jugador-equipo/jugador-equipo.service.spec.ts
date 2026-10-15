import { BadRequestException, NotFoundException } from '@nestjs/common';
import { JugadorEquipoService } from './jugador-equipo.service.js';

function createService() {
  const prisma = {
    equipo: { findUnique: vi.fn() },
    posicion: { findUnique: vi.fn() },
    jugador: { findMany: vi.fn(), findUnique: vi.fn() },
    jugador_equipo: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };

  return { service: new JugadorEquipoService(prisma as any), prisma };
}

describe('JugadorEquipoService', () => {
  it('lanza NotFoundException si el equipo no existe', async () => {
    const { service, prisma } = createService();
    prisma.equipo.findUnique.mockResolvedValue(null);

    await expect(service.findDisponibles(99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('excluye de disponibles a los jugadores ya activos en el equipo', async () => {
    const { service, prisma } = createService();
    prisma.equipo.findUnique.mockResolvedValue({ id_equipo: 1 });
    prisma.jugador.findMany.mockResolvedValue([]);

    await service.findDisponibles(1);

    expect(prisma.jugador.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          NOT: { jugador_equipo: { some: { id_equipo: 1, activo: true } } },
        }),
      }),
    );
  });

  it('reactiva una relacion jugador_equipo inactiva en lugar de duplicarla', async () => {
    const { service, prisma } = createService();
    prisma.equipo.findUnique.mockResolvedValue({ id_equipo: 1 });
    prisma.jugador.findUnique.mockResolvedValue({ id_jugador: 5 });
    prisma.jugador_equipo.findFirst.mockResolvedValue({
      id_jugador_equipo: 10,
      activo: false,
      dorsal: 7,
      id_posicion: 2,
    });
    prisma.jugador_equipo.update.mockResolvedValue({ id_jugador_equipo: 10, activo: true });

    await service.assign(1, 5);

    expect(prisma.jugador_equipo.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id_jugador_equipo: 10 } }),
    );
    expect(prisma.jugador_equipo.create).not.toHaveBeenCalled();
  });

  it('rechaza asignar un jugador que no existe', async () => {
    const { service, prisma } = createService();
    prisma.equipo.findUnique.mockResolvedValue({ id_equipo: 1 });
    prisma.jugador.findUnique.mockResolvedValue(null);

    await expect(service.assign(1, 999)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lanza NotFoundException al quitar un jugador que no esta activo en el equipo', async () => {
    const { service, prisma } = createService();
    prisma.equipo.findUnique.mockResolvedValue({ id_equipo: 1 });
    prisma.jugador_equipo.findFirst.mockResolvedValue(null);

    await expect(service.remove(1, 5)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('desactiva (soft-delete) la relacion en vez de borrarla al quitar un jugador', async () => {
    const { service, prisma } = createService();
    prisma.equipo.findUnique.mockResolvedValue({ id_equipo: 1 });
    prisma.jugador_equipo.findFirst.mockResolvedValue({ id_jugador_equipo: 10, activo: true });
    prisma.jugador_equipo.update.mockResolvedValue({ id_jugador_equipo: 10, activo: false });

    await service.remove(1, 5);

    expect(prisma.jugador_equipo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id_jugador_equipo: 10 },
        data: expect.objectContaining({ activo: false }),
      }),
    );
  });

  it('devuelve en la plantilla la posición del equipo y la preferida del jugador', async () => {
    const { service, prisma } = createService();
    prisma.equipo.findUnique.mockResolvedValue({ id_equipo: 1 });
    prisma.jugador_equipo.findMany.mockResolvedValue([{
      id_jugador_equipo: 10,
      id_jugador: 5,
      dorsal: 7,
      fecha_inicio: new Date('2026-09-01'),
      jugador: { id_jugador: 5, posicion_preferida: { id_posicion: 1, nombre: 'Defensa' } },
      posicion: { id_posicion: 2, nombre: 'Portero' },
    }]);

    const roster = await service.findPlantilla(1);

    expect(roster[0]).toMatchObject({
      posicion: { id_posicion: 2, nombre: 'Portero' },
      jugador: { posicion_preferida: { id_posicion: 1, nombre: 'Defensa' } },
    });
  });

  it('actualiza o limpia la posición de una pertenencia activa', async () => {
    const { service, prisma } = createService();
    prisma.equipo.findUnique.mockResolvedValue({ id_equipo: 1 });
    prisma.posicion.findUnique.mockResolvedValue({ id_posicion: 3, nombre: 'Delantero' });
    prisma.jugador_equipo.findFirst.mockResolvedValue({ id_jugador_equipo: 10 });
    prisma.jugador_equipo.update.mockResolvedValue({ id_jugador_equipo: 10, id_posicion: 3 });

    await service.updatePosition(1, 5, 3);
    expect(prisma.jugador_equipo.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id_jugador_equipo: 10 },
      data: { id_posicion: 3 },
      include: { posicion: true },
    }));

    await service.updatePosition(1, 5, null);
    expect(prisma.jugador_equipo.update).toHaveBeenLastCalledWith(expect.objectContaining({
      data: { id_posicion: null },
    }));
  });

  it('rechaza asignar una posición inexistente a la plantilla', async () => {
    const { service, prisma } = createService();
    prisma.equipo.findUnique.mockResolvedValue({ id_equipo: 1 });
    prisma.posicion.findUnique.mockResolvedValue(null);

    await expect(service.updatePosition(1, 5, 99)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.jugador_equipo.update).not.toHaveBeenCalled();
  });
});
