import { Prisma } from '@prisma/client';
import { UsuariosService } from './usuarios.service.js';

function createService() {
  const prisma = {
    usuario: { create: vi.fn() },
    rol: { findUnique: vi.fn() },
  };

  return { service: new UsuariosService(prisma as any), prisma };
}

const baseDto = {
  nombre: 'Ana Admin',
  email: 'ANA@Athlyzer.LOCAL',
  password: 'password-segura',
  id_rol: 1,
};

describe('UsuariosService.create (unicidad de email)', () => {
  it('normaliza el email (trim + minusculas) antes de persistir', async () => {
    const { service, prisma } = createService();
    prisma.rol.findUnique.mockResolvedValue({ id_rol: 1, nombre: 'admin' });
    prisma.usuario.create.mockResolvedValue({
      id_usuario: 1,
      nombre: 'Ana Admin',
      email: 'ana@athlyzer.local',
      activo: true,
      id_rol: 1,
      rol: { nombre: 'admin' },
    });

    await service.create({ ...baseDto, email: '  ANA@Athlyzer.LOCAL  ' });

    expect(prisma.usuario.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: 'ana@athlyzer.local' }),
      }),
    );
  });

  it('propaga el error de unicidad de Prisma cuando el email ya existe', async () => {
    const { service, prisma } = createService();
    prisma.rol.findUnique.mockResolvedValue({ id_rol: 1, nombre: 'admin' });
    prisma.usuario.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed on the fields: (`email`)', {
        code: 'P2002',
        clientVersion: '6.0.0',
        meta: { target: ['email'] },
      }),
    );

    await expect(service.create(baseDto)).rejects.toMatchObject({ code: 'P2002' });
  });
});
