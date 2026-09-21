import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { GlobalExceptionFilter } from '../src/common/global-exception.filter.js';
import { getJwtSecret } from '../src/auth/jwt.config.js';
import type { AuthRole } from '../src/auth/auth.types.js';

const jwtService = new JwtService({});

function tokenFor(role: AuthRole) {
  return jwtService.sign(
    { id_usuario: 1, email: 'test@athlyzer.local', role },
    { secret: getJwtSecret(), expiresIn: '1h' },
  );
}

async function createApp(prismaMock: Record<string, unknown>) {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue(prismaMock)
    .compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  await app.init();
  return app;
}

describe('Endpoints protegidos: equipos y usuarios (e2e)', () => {
  const prismaMock = {
    equipo: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    temporada: { findUnique: vi.fn() },
    categoria: { findFirst: vi.fn() },
    usuario: { findMany: vi.fn().mockResolvedValue([]), findUnique: vi.fn() },
    rol: { findMany: vi.fn().mockResolvedValue([]) },
    jugador: { findMany: vi.fn().mockResolvedValue([]) },
  };

  let app: Awaited<ReturnType<typeof createApp>>;

  beforeAll(async () => {
    app = await createApp(prismaMock);
  });

  afterAll(async () => {
    await app.close();
  });

  it('rechaza peticiones sin token (401)', () => {
    return request(app.getHttpServer()).get('/api/equipos').expect(401);
  });

  it('rechaza peticiones con token invalido (401)', () => {
    return request(app.getHttpServer())
      .get('/api/equipos')
      .set('Authorization', 'Bearer token-invalido')
      .expect(401);
  });

  it('permite a cualquier rol autenticado leer equipos (200)', () => {
    return request(app.getHttpServer())
      .get('/api/equipos')
      .set('Authorization', `Bearer ${tokenFor('usuario')}`)
      .expect(200);
  });

  it('rechaza a un usuario no admin creando un equipo (403)', () => {
    return request(app.getHttpServer())
      .post('/api/equipos')
      .set('Authorization', `Bearer ${tokenFor('usuario')}`)
      .send({ nombre: 'Equipo Test', id_temporada: 1 })
      .expect(403);
  });

  it('rechaza un payload invalido incluso para un admin (400)', () => {
    return request(app.getHttpServer())
      .post('/api/equipos')
      .set('Authorization', `Bearer ${tokenFor('admin')}`)
      .send({})
      .expect(400);
  });

  it('rechaza campos no declarados en el DTO (400)', () => {
    return request(app.getHttpServer())
      .post('/api/jugadores')
      .set('Authorization', `Bearer ${tokenFor('admin')}`)
      .send({
        dni: '12345678A',
        nombre: 'Ana',
        apellidos: 'Garcia',
        fecha_nacimiento: '2000-01-01',
        campoNoPermitido: 'valor',
      })
      .expect(400);
  });

  it('permite a un admin acceder al endpoint de usuarios (200)', () => {
    return request(app.getHttpServer())
      .get('/api/usuarios')
      .set('Authorization', `Bearer ${tokenFor('admin')}`)
      .expect(200);
  });

  it('rechaza a un rol no admin en el endpoint de usuarios (403)', () => {
    return request(app.getHttpServer())
      .get('/api/usuarios')
      .set('Authorization', `Bearer ${tokenFor('jugador')}`)
      .expect(403);
  });

  it('aplica rate limiting al login tras superar el limite de intentos (429)', async () => {
    let lastStatus = 0;

    for (let i = 0; i < 6; i += 1) {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'sin-existir@athlyzer.local', password: 'lo-que-sea' });
      lastStatus = response.status;
    }

    expect(lastStatus).toBe(429);
  });
});

describe('Auth login: casos de negocio (e2e)', () => {
  const prismaMock = {
    usuario: { findUnique: vi.fn() },
  };

  let app: Awaited<ReturnType<typeof createApp>>;

  beforeAll(async () => {
    app = await createApp(prismaMock);
  });

  afterAll(async () => {
    await app.close();
  });

  it('rechaza un usuario inexistente (404)', () => {
    prismaMock.usuario.findUnique.mockResolvedValueOnce(null);

    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'no-existe@athlyzer.local', password: 'cualquiera' })
      .expect(404);
  });

  it('rechaza un usuario inactivo (400)', () => {
    prismaMock.usuario.findUnique.mockResolvedValueOnce({
      id_usuario: 1,
      nombre: 'Inactivo',
      email: 'inactivo@athlyzer.local',
      password_hash: bcrypt.hashSync('cualquiera', 4),
      activo: false,
      rol: { nombre: 'usuario' },
    });

    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'inactivo@athlyzer.local', password: 'cualquiera' })
      .expect(400);
  });

  it('rechaza credenciales invalidas por password incorrecta (400)', () => {
    prismaMock.usuario.findUnique.mockResolvedValueOnce({
      id_usuario: 1,
      nombre: 'Activo',
      email: 'activo@athlyzer.local',
      password_hash: bcrypt.hashSync('password-correcta', 4),
      activo: true,
      rol: { nombre: 'usuario' },
    });

    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'activo@athlyzer.local', password: 'password-incorrecta' })
      .expect(400);
  });

  it('rechaza un body de login con propiedades no declaradas en el DTO (400)', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'activo@athlyzer.local', password: 'password-correcta', rememberMe: true })
      .expect(400);
  });

  it('permite iniciar sesion con credenciales validas y devuelve un accessToken', async () => {
    prismaMock.usuario.findUnique.mockResolvedValueOnce({
      id_usuario: 1,
      nombre: 'Activo',
      email: 'activo@athlyzer.local',
      password_hash: bcrypt.hashSync('password-correcta', 4),
      activo: true,
      rol: { nombre: 'usuario' },
    });

    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'activo@athlyzer.local', password: 'password-correcta' })
      .expect(201);

    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.role).toBe('usuario');
  });
});

describe('Categorias (e2e)', () => {
  const prismaMock = {
    categoria: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn(),
      create: vi.fn().mockResolvedValue({ id_categoria: 1, nombre: 'Alevin', activo: true }),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };

  let app: Awaited<ReturnType<typeof createApp>>;

  beforeAll(async () => {
    app = await createApp(prismaMock);
  });

  afterAll(async () => {
    await app.close();
  });

  it('rechaza peticiones sin token (401)', () => {
    return request(app.getHttpServer()).get('/api/categorias').expect(401);
  });

  it('rechaza la lectura a un rol no admin (403)', () => {
    return request(app.getHttpServer())
      .get('/api/categorias')
      .set('Authorization', `Bearer ${tokenFor('usuario')}`)
      .expect(403);
  });

  it('permite la lectura a un admin (200)', () => {
    return request(app.getHttpServer())
      .get('/api/categorias')
      .set('Authorization', `Bearer ${tokenFor('admin')}`)
      .expect(200);
  });

  it('rechaza un payload invalido (400)', () => {
    return request(app.getHttpServer())
      .post('/api/categorias')
      .set('Authorization', `Bearer ${tokenFor('admin')}`)
      .send({})
      .expect(400);
  });

  it('rechaza campos no declarados en el DTO (400)', () => {
    return request(app.getHttpServer())
      .post('/api/categorias')
      .set('Authorization', `Bearer ${tokenFor('admin')}`)
      .send({ nombre: 'Alevin', campoNoPermitido: 'valor' })
      .expect(400);
  });

  it('permite crear una categoria valida a un admin (201)', () => {
    return request(app.getHttpServer())
      .post('/api/categorias')
      .set('Authorization', `Bearer ${tokenFor('admin')}`)
      .send({ nombre: 'Alevin' })
      .expect(201);
  });
});

describe('Jugadores (e2e)', () => {
  const prismaMock = {
    jugador: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn(),
      create: vi.fn().mockResolvedValue({ id_jugador: 1 }),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };

  let app: Awaited<ReturnType<typeof createApp>>;

  beforeAll(async () => {
    app = await createApp(prismaMock);
  });

  afterAll(async () => {
    await app.close();
  });

  it('rechaza peticiones sin token (401)', () => {
    return request(app.getHttpServer()).get('/api/jugadores').expect(401);
  });

  it('permite a cualquier rol autenticado leer jugadores (200)', () => {
    return request(app.getHttpServer())
      .get('/api/jugadores')
      .set('Authorization', `Bearer ${tokenFor('jugador')}`)
      .expect(200);
  });

  it('rechaza a un rol no admin creando un jugador (403)', () => {
    return request(app.getHttpServer())
      .post('/api/jugadores')
      .set('Authorization', `Bearer ${tokenFor('usuario')}`)
      .send({
        dni: '12345678A',
        nombre: 'Ana',
        apellidos: 'Garcia',
        fecha_nacimiento: '2000-01-01',
      })
      .expect(403);
  });

  it('rechaza un payload invalido incluso para un admin (400)', () => {
    return request(app.getHttpServer())
      .post('/api/jugadores')
      .set('Authorization', `Bearer ${tokenFor('admin')}`)
      .send({ nombre: 'Ana' })
      .expect(400);
  });

  it('permite crear un jugador valido a un admin (201)', () => {
    return request(app.getHttpServer())
      .post('/api/jugadores')
      .set('Authorization', `Bearer ${tokenFor('admin')}`)
      .send({
        dni: '12345678A',
        nombre: 'Ana',
        apellidos: 'Garcia',
        fecha_nacimiento: '2000-01-01',
      })
      .expect(201);
  });
});

describe('Temporadas (e2e)', () => {
  const prismaMock = {
    temporada: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn(),
      create: vi.fn().mockResolvedValue({ id_temporada: 1 }),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };

  let app: Awaited<ReturnType<typeof createApp>>;

  beforeAll(async () => {
    app = await createApp(prismaMock);
  });

  afterAll(async () => {
    await app.close();
  });

  it('rechaza peticiones sin token (401)', () => {
    return request(app.getHttpServer()).get('/api/temporadas').expect(401);
  });

  it('permite a cualquier rol autenticado leer temporadas (200)', () => {
    return request(app.getHttpServer())
      .get('/api/temporadas')
      .set('Authorization', `Bearer ${tokenFor('usuario')}`)
      .expect(200);
  });

  it('rechaza a un rol no admin creando una temporada (403)', () => {
    return request(app.getHttpServer())
      .post('/api/temporadas')
      .set('Authorization', `Bearer ${tokenFor('usuario')}`)
      .send({ nombre: 'Temporada Test', fecha_inicio: '2026-09-01', fecha_fin: '2027-06-30' })
      .expect(403);
  });

  it('rechaza fecha_fin anterior a fecha_inicio (400)', () => {
    return request(app.getHttpServer())
      .post('/api/temporadas')
      .set('Authorization', `Bearer ${tokenFor('admin')}`)
      .send({ nombre: 'Temporada Test', fecha_inicio: '2027-06-30', fecha_fin: '2026-09-01' })
      .expect(400);
  });

  it('permite crear una temporada valida a un admin (201)', () => {
    return request(app.getHttpServer())
      .post('/api/temporadas')
      .set('Authorization', `Bearer ${tokenFor('admin')}`)
      .send({ nombre: 'Temporada Test', fecha_inicio: '2026-09-01', fecha_fin: '2027-06-30' })
      .expect(201);
  });
});
