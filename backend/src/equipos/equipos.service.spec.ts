import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProtocoloAntropometrico } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EquiposService } from './equipos.service.js';

describe('EquiposService: modalidad y conservación', () => {
  const prisma = {
    equipo: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    temporada: { findUnique: vi.fn() },
  };
  const service = new EquiposService(prisma as never);

  beforeEach(() => {
    vi.resetAllMocks();
    prisma.temporada.findUnique.mockResolvedValue({ id_temporada: 1 });
    prisma.equipo.findUnique.mockResolvedValue({
      id_equipo: 1, protocolo_antropometrico: 'ISAK', version_protocolo_antropometrico: 1,
    });
  });

  it('crea nuevos equipos como BASICA por defecto', async () => {
    await service.create({ nombre: 'Equipo', id_temporada: 1 });
    expect(prisma.equipo.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ protocolo_antropometrico: 'BASICA' }),
    }));
  });

  it('permite seleccionar ISAK al crear el equipo', async () => {
    await service.create({ nombre: 'Equipo', id_temporada: 1, protocolo_antropometrico: ProtocoloAntropometrico.ISAK });
    expect(prisma.equipo.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ protocolo_antropometrico: 'ISAK' }),
    }));
  });

  it('incrementa la versión solo al cambiar la modalidad', async () => {
    await service.update(1, { protocolo_antropometrico: ProtocoloAntropometrico.BASICA });
    expect(prisma.equipo.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id_equipo: 1, version_protocolo_antropometrico: 1 },
      data: { protocolo_antropometrico: 'BASICA', version_protocolo_antropometrico: { increment: 1 } },
    }));
  });

  it('no incrementa la versión si se conserva la modalidad', async () => {
    await service.update(1, { protocolo_antropometrico: ProtocoloAntropometrico.ISAK });
    expect(prisma.equipo.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { protocolo_antropometrico: 'ISAK' },
    }));
  });

  it('impide borrar físicamente cualquier equipo, incluso sin mediciones', async () => {
    await expect(service.remove(1)).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.equipo.delete).not.toHaveBeenCalled();
  });

  it('devuelve 404 al intentar borrar un equipo inexistente', async () => {
    prisma.equipo.findUnique.mockResolvedValue(null);
    await expect(service.remove(99)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.equipo.delete).not.toHaveBeenCalled();
  });
});