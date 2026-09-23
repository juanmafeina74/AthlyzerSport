import { Prisma } from '@prisma/client';
import { JugadoresService } from './jugadores.service.js';

function createService() {
  const prisma = {
    jugador: { create: vi.fn(), findUnique: vi.fn() },
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
      },
    });
  });
});
