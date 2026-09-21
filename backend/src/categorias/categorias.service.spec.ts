import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CategoriasService } from './categorias.service.js';

function createService() {
  const prisma = {
    categoria: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  };

  return { service: new CategoriasService(prisma as any), prisma };
}

describe('CategoriasService.remove', () => {
  it('no permite borrar una categoria asignada a equipos', async () => {
    const { service, prisma } = createService();
    prisma.categoria.findUnique.mockResolvedValue({
      id_categoria: 1,
      nombre: 'Alevin',
      activo: true,
      _count: { equipos: 2 },
    });

    await expect(service.remove(1)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.categoria.delete).not.toHaveBeenCalled();
  });

  it('borra la categoria cuando no tiene equipos asociados', async () => {
    const { service, prisma } = createService();
    prisma.categoria.findUnique.mockResolvedValue({
      id_categoria: 1,
      nombre: 'Alevin',
      activo: true,
      _count: { equipos: 0 },
    });
    prisma.categoria.delete.mockResolvedValue({ id_categoria: 1 });

    const result = await service.remove(1);

    expect(prisma.categoria.delete).toHaveBeenCalledWith({ where: { id_categoria: 1 } });
    expect(result).toEqual({ deleted: true });
  });

  it('lanza NotFoundException si la categoria no existe', async () => {
    const { service, prisma } = createService();
    prisma.categoria.findUnique.mockResolvedValue(null);

    await expect(service.remove(99)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.categoria.delete).not.toHaveBeenCalled();
  });
});
