import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MedicionesAntropometricasService } from './mediciones-antropometricas.service.js';

const input = {
  id_jugador: 4,
  fecha: '2026-09-22T10:30:00.000Z',
  peso_kg: 74.5,
  talla_cm: 178,
  pliegue_tricipital: 8,
  pliegue_subescapular: 10,
  pliegue_supraespinal: 7,
  pliegue_abdominal: 12,
  pliegue_muslo: 11,
  pliegue_pantorrilla: 7,
};

describe('MedicionesAntropometricasService', () => {
  const prisma = {
    jugador: { findUnique: vi.fn() },
    medicion_antropometrica: { create: vi.fn(), findMany: vi.fn() },
  };
  const service = new MedicionesAntropometricasService(prisma as never);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persiste el evaluador autenticado y los resultados calculados en servidor', async () => {
    prisma.jugador.findUnique.mockResolvedValue({ id_jugador: 4 });
    prisma.medicion_antropometrica.create.mockResolvedValue({ id_medicion: 1 });

    await service.create(input, 9);

    expect(prisma.medicion_antropometrica.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          id_jugador: 4,
          id_evaluador: 9,
          sumatoria_6_pliegues: 55,
          porcentaje_grasa: 11.44,
        }),
      }),
    );
  });

  it('rechaza una medición para un jugador inexistente', async () => {
    prisma.jugador.findUnique.mockResolvedValue(null);

    await expect(service.create(input, 9)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.medicion_antropometrica.create).not.toHaveBeenCalled();
  });
});