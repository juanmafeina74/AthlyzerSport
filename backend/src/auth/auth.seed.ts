import { randomBytes } from 'node:crypto';
import bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';

const SALT_ROUNDS = 12;

async function hashDemoPassword(envName: string) {
  const password = process.env[envName]?.trim();

  if (!password) {
    return undefined;
  }

  return bcrypt.hash(password, SALT_ROUNDS);
}

function isBcryptHash(value: string) {
  return /^\$2[aby]\$\d{2}\$/.test(value);
}

async function createUnusablePasswordHash() {
  return bcrypt.hash(randomBytes(32).toString('hex'), SALT_ROUNDS);
}

async function upsertDemoUser(
  prisma: PrismaService,
  data: {
    email: string;
    nombre: string;
    passwordEnvName: string;
    id_rol: number;
  },
) {
  const passwordHash = await hashDemoPassword(data.passwordEnvName);

  if (!passwordHash) {
    const existingUser = await prisma.usuario.findUnique({ where: { email: data.email } });

    if (existingUser && !isBcryptHash(existingUser.password_hash)) {
      await prisma.usuario.update({
        where: { email: data.email },
        data: {
          password_hash: await createUnusablePasswordHash(),
          activo: false,
        },
      });
    }

    return;
  }

  await prisma.usuario.upsert({
    where: { email: data.email },
    update: {
      password_hash: passwordHash,
      id_rol: data.id_rol,
      activo: true,
    },
    create: {
      nombre: data.nombre,
      email: data.email,
      password_hash: passwordHash,
      id_rol: data.id_rol,
      activo: true,
    },
  });
}

export async function seedDefaultAuthData(prisma: PrismaService) {
  const roles = ['admin', 'usuario', 'jugador'];

  for (const role of roles) {
    await prisma.rol.upsert({
      where: { nombre: role },
      update: {},
      create: { nombre: role },
    });
  }

  const admin = await prisma.rol.findUnique({ where: { nombre: 'admin' } });
  const usuario = await prisma.rol.findUnique({ where: { nombre: 'usuario' } });
  const jugador = await prisma.rol.findUnique({ where: { nombre: 'jugador' } });

  if (process.env.NODE_ENV === 'production') {
    return;
  }

  await upsertDemoUser(prisma, {
    nombre: 'Administrador',
    email: 'admin@athlyzer.local',
    passwordEnvName: 'DEMO_ADMIN_PASSWORD',
    id_rol: admin!.id_rol,
  });

  await upsertDemoUser(prisma, {
    nombre: 'Usuario Demo',
    email: 'usuario@athlyzer.local',
    passwordEnvName: 'DEMO_USER_PASSWORD',
    id_rol: usuario!.id_rol,
  });

  await upsertDemoUser(prisma, {
    nombre: 'Jugador Demo',
    email: 'jugador@athlyzer.local',
    passwordEnvName: 'DEMO_PLAYER_PASSWORD',
    id_rol: jugador!.id_rol,
  });
}
