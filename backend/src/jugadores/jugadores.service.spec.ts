import { Prisma } from '@prisma/client';
import { JugadoresService } from './jugadores.service.js';

function createService() {
  const prisma = {
    jugador: { create: vi.fn() },
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
