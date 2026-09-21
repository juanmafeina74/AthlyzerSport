import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TemporadasService } from './temporadas.service.js';

function createService() {
  const prisma = {
    temporada: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  };

  return { service: new TemporadasService(prisma as any), prisma };
}

describe('TemporadasService.create', () => {
  it('rechaza una fecha_fin anterior a fecha_inicio', async () => {
    const { service } = createService();

    await expect(
      service.create({
        nombre: 'Temporada Test',
        fecha_inicio: '2027-06-30',
        fecha_fin: '2026-09-01',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('crea la temporada cuando las fechas son validas', async () => {
    const { service, prisma } = createService();
    prisma.temporada.create.mockResolvedValue({ id_temporada: 1 });

    await service.create({
      nombre: 'Temporada Test',
      fecha_inicio: '2026-09-01',
      fecha_fin: '2027-06-30',
    });

    expect(prisma.temporada.create).toHaveBeenCalled();
  });
});

describe('TemporadasService.remove', () => {
  it('no permite borrar una temporada con equipos asociados', async () => {
    const { service, prisma } = createService();
    prisma.temporada.findUnique.mockResolvedValue({
      id_temporada: 1,
      nombre: 'Temporada Test',
      _count: { equipo: 2 },
    });

    await expect(service.remove(1)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.temporada.delete).not.toHaveBeenCalled();
  });

  it('borra la temporada cuando no tiene equipos asociados', async () => {
    const { service, prisma } = createService();
    prisma.temporada.findUnique.mockResolvedValue({
      id_temporada: 1,
      nombre: 'Temporada Test',
      _count: { equipo: 0 },
    });
    prisma.temporada.delete.mockResolvedValue({ id_temporada: 1 });

    await service.remove(1);

    expect(prisma.temporada.delete).toHaveBeenCalledWith({ where: { id_temporada: 1 } });
  });

  it('lanza NotFoundException si la temporada no existe', async () => {
    const { service, prisma } = createService();
    prisma.temporada.findUnique.mockResolvedValue(null);

    await expect(service.remove(99)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.temporada.delete).not.toHaveBeenCalled();
  });
});
