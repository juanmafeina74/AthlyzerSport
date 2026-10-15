import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { JugadoresService } from './jugadores.service.js';

function createService() {
  const prisma = {
    jugador: { create: vi.fn(), findUnique: vi.fn() },
    posicion: { findUnique: vi.fn() },
  };

  return { service: new JugadoresService(prisma as any), prisma };
}

const baseDto = {
  dni: '12345678A',
  nombre: 'Ana',
  apellidos: 'Garcia',
  fecha_nacimiento: '2000-01-01',
};

describe('JugadoresService.create (unicidad de DNI)', () => {
  it('propaga el error de unicidad de Prisma cuando el DNI ya existe', async () => {
    const { service, prisma } = createService();
    prisma.jugador.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed on the fields: (`dni`)', {
        code: 'P2002',
        clientVersion: '6.0.0',
        meta: { target: ['dni'] },
      }),
    );

    await expect(service.create(baseDto)).rejects.toMatchObject({ code: 'P2002' });
  });

  it('crea el jugador cuando el DNI no existe todavia', async () => {
    const { service, prisma } = createService();
    prisma.jugador.create.mockResolvedValue({ id_jugador: 1, ...baseDto });

    await service.create(baseDto);

    expect(prisma.jugador.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ dni: '12345678A' }) }),
    );
  });

  it('guarda la posición preferida si existe en el catálogo', async () => {
    const { service, prisma } = createService();
    prisma.posicion.findUnique.mockResolvedValue({ id_posicion: 3, nombre: 'Portero' });
    prisma.jugador.create.mockResolvedValue({ id_jugador: 1, ...baseDto, id_posicion_preferida: 3 });

    await service.create({ ...baseDto, id_posicion_preferida: 3 });

    expect(prisma.jugador.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ id_posicion_preferida: 3 }),
      include: { posicion_preferida: true },
    }));
  });

  it('rechaza una posición preferida que no exista', async () => {
    const { service, prisma } = createService();
    prisma.posicion.findUnique.mockResolvedValue(null);

    await expect(service.create({ ...baseDto, id_posicion_preferida: 99 }))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.jugador.create).not.toHaveBeenCalled();
  });
});

describe('JugadoresService.findOne', () => {
  it('carga la ficha con equipos, lesiones y las cinco mediciones más recientes', async () => {
    const { service, prisma } = createService();
    prisma.jugador.findUnique.mockResolvedValue({ id_jugador: 1 });

    await service.findOne(1);

    expect(prisma.jugador.findUnique).toHaveBeenCalledWith({
      where: { id_jugador: 1 },
      include: {
        jugador_equipo: {
          include: {
            posicion: true,
            equipo: { include: { categoria: true, temporada: true } },
          },
          orderBy: { fecha_inicio: 'desc' },
        },
        lesion: { orderBy: { fecha_inicio: 'desc' } },
        medicion_antropometrica: {
          include: { evaluador: { select: { id_usuario: true, nombre: true } } },
          orderBy: [{ fecha: 'desc' }, { id_medicion: 'desc' }],
          take: 5,
        },
        posicion_preferida: true,
      },
    });
  });
});
