import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PosicionesService } from './posiciones.service.js';

describe('PosicionesService', () => {
  const prisma = {
    posicion: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  };
  const service = new PosicionesService(prisma as never);

  beforeEach(() => vi.resetAllMocks());

  it('lista posiciones por nombre', async () => {
    prisma.posicion.findMany.mockResolvedValue([]);
    await service.findAll();
    expect(prisma.posicion.findMany).toHaveBeenCalledWith({ orderBy: { nombre: 'asc' } });
  });

  it('normaliza nombre y abreviatura al crear', async () => {
    prisma.posicion.create.mockResolvedValue({ id_posicion: 1, nombre: 'Portero', abreviatura: 'POR' });
    await service.create({ nombre: ' Portero ', abreviatura: ' POR ' });
    expect(prisma.posicion.create).toHaveBeenCalledWith({
      data: { nombre: 'Portero', abreviatura: 'POR' },
    });
  });

  it('rechaza un nombre vacío después de quitar espacios', async () => {
    expect(() => service.create({ nombre: '   ' })).toThrow('El nombre de la posición es obligatorio.');
    expect(prisma.posicion.create).not.toHaveBeenCalled();
  });

  it('rechaza eliminar una posición referenciada', async () => {
    prisma.posicion.findUnique.mockResolvedValue({ id_posicion: 1 });
    prisma.posicion.delete.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Restrict', {
      code: 'P2003', clientVersion: '6.19.3',
    }));
    await expect(service.remove(1)).rejects.toBeInstanceOf(ConflictException);
  });

  it('responde 404 al actualizar una posición inexistente', async () => {
    prisma.posicion.findUnique.mockResolvedValue(null);
    await expect(service.update(99, { nombre: 'Portero' })).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.posicion.update).not.toHaveBeenCalled();
  });
});