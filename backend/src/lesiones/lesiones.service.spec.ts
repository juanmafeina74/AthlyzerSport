import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LesionesService } from './lesiones.service.js';

function setup() {
  const prisma = {
    lesion: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    jugador: { findUnique: vi.fn() },
  };
  return { service: new LesionesService(prisma as any), prisma };
}

describe('LesionesService', () => {
  it('registra una lesión vinculada a un jugador existente', async () => {
    const { service, prisma } = setup();
    prisma.jugador.findUnique.mockResolvedValue({ id_jugador: 4 });
    prisma.lesion.create.mockResolvedValue({ id_lesion: 7 });

    await service.create({ id_jugador: 4, fecha_inicio: '2026-09-30', tipo_lesion: 'Esguince', zona_corporal: 'Tobillo · Derecho · anterior' });

    expect(prisma.lesion.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ id_jugador: 4, tipo_lesion: 'Esguince', zona_corporal: 'Tobillo · Derecho · anterior' }),
    }));
  });

  it('rechaza jugadores inexistentes', async () => {
    const { service, prisma } = setup();
    prisma.jugador.findUnique.mockResolvedValue(null);
    await expect(service.create({ id_jugador: 99, fecha_inicio: '2026-09-30', tipo_lesion: 'Esguince', zona_corporal: 'Tobillo' })).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.lesion.create).not.toHaveBeenCalled();
  });

  it('cambia una lesión activa de fase sin dar el alta', async () => {
    const { service, prisma } = setup();
    prisma.lesion.findUnique.mockResolvedValue({ alta_medica: false, fase_readaptacion: 'Fase 1' });
    await service.actualizarFase(7, 'Fase 2');
    expect(prisma.lesion.update).toHaveBeenCalledWith({
      where: { id_lesion: 7 },
      data: { fase_readaptacion: 'Fase 2', alta_medica: false, fecha_alta_real: null },
    });
  });

  it('registra el alta médica solo al completar fase 4', async () => {
    const { service, prisma } = setup();
    prisma.lesion.findUnique.mockResolvedValue({ alta_medica: false, fase_readaptacion: 'Fase 4' });
    await service.actualizarFase(7, 'Alta Médica');
    expect(prisma.lesion.update).toHaveBeenCalledWith({
      where: { id_lesion: 7 },
      data: { fase_readaptacion: 'Alta Médica', alta_medica: true, fecha_alta_real: expect.any(Date) },
    });
  });

  it('rechaza fases desconocidas, alta prematura y reapertura tras el alta', async () => {
    const { service, prisma } = setup();
    await expect(service.actualizarFase(7, 'Otra')).rejects.toBeInstanceOf(BadRequestException);
    prisma.lesion.findUnique.mockResolvedValue({ alta_medica: false, fase_readaptacion: 'Fase 2' });
    await expect(service.actualizarFase(7, 'Alta Médica')).rejects.toBeInstanceOf(BadRequestException);
    prisma.lesion.findUnique.mockResolvedValue({ alta_medica: true, fase_readaptacion: 'Alta Médica' });
    await expect(service.actualizarFase(7, 'Fase 1')).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.lesion.update).not.toHaveBeenCalled();
  });

  it('devuelve 404 si la lesión no existe', async () => {
    const { service, prisma } = setup();
    prisma.lesion.findUnique.mockResolvedValue(null);
    await expect(service.actualizarFase(99, 'Fase 2')).rejects.toBeInstanceOf(NotFoundException);
  });
});