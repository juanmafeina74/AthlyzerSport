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

describe('Modalidades antropométricas (e2e)', () => {
  const prismaMock = {
    jugador: { findUnique: vi.fn() },
    equipo: { findUnique: vi.fn(), updateMany: vi.fn(), update: vi.fn(), create: vi.fn(), delete: vi.fn() },
    temporada: { findUnique: vi.fn() },
    jugador_equipo: { findFirst: vi.fn(), findMany: vi.fn() },
    medicion_antropometrica: { create: vi.fn(), findMany: vi.fn() },
    $transaction: vi.fn(),
  };
  const basic = { id_jugador: 4, protocolo: 'BASICA', peso_kg: 74.5, talla_cm: 178 };
  let app: Awaited<ReturnType<typeof createApp>>;

  beforeAll(async () => {
    app = await createApp(prismaMock);
  });

  beforeEach(() => {
    prismaMock.$transaction.mockReset();
    for (const model of [prismaMock.jugador, prismaMock.equipo, prismaMock.temporada,
      prismaMock.jugador_equipo, prismaMock.medicion_antropometrica]) {
      for (const method of Object.values(model)) {
        method.mockReset();
      }
    }
    prismaMock.$transaction.mockImplementation((callback) => callback(prismaMock));
    prismaMock.jugador.findUnique.mockResolvedValue({ id_jugador: 4 });
    prismaMock.equipo.findUnique.mockResolvedValue({
      id_equipo: 1, protocolo_antropometrico: 'BASICA', version_protocolo_antropometrico: 1,
    });
    prismaMock.equipo.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.jugador_equipo.findFirst.mockResolvedValue({ activo: true });
    prismaMock.jugador_equipo.findMany.mockResolvedValue([]);
    prismaMock.medicion_antropometrica.create.mockImplementation(({ data }) => ({ id_medicion: 1, ...data }));
    prismaMock.temporada.findUnique.mockResolvedValue({ id_temporada: 1 });
    prismaMock.equipo.create.mockImplementation(({ data }) => ({ id_equipo: 1, ...data }));
    prismaMock.equipo.update.mockImplementation(({ data }) => ({ id_equipo: 1, ...data }));
  });

  afterAll(async () => {
    await app.close();
  });

  it('exige autenticación para registrar mediciones', () => {
    return request(app.getHttpServer()).post('/api/mediciones-antropometricas').send(basic).expect(401);
  });

  it('no permite al rol jugador registrar mediciones', () => {
    return request(app.getHttpServer()).post('/api/mediciones-antropometricas')
      .set('Authorization', `Bearer ${tokenFor('jugador')}`).send(basic).expect(403);
  });

  it.each(['admin', 'usuario'] as const)('permite BASICA sin equipo a %s y toma el evaluador del JWT', async (role) => {
    const response = await request(app.getHttpServer()).post('/api/mediciones-antropometricas')
      .set('Authorization', `Bearer ${tokenFor(role)}`).send(basic).expect(201);
    expect(response.body).toMatchObject({ id_equipo: null, protocolo: 'BASICA', id_evaluador: 1, porcentaje_grasa: null });
  });

  it.each(['id_evaluador', 'porcentaje_grasa', 'sumatoria_6_pliegues', 'somatotipo_endomorfia'])('rechaza el campo no confiable %s', async (field) => {
    await request(app.getHttpServer()).post('/api/mediciones-antropometricas')
      .set('Authorization', `Bearer ${tokenFor('usuario')}`).send({ ...basic, [field]: 99 }).expect(400);
    expect(prismaMock.medicion_antropometrica.create).not.toHaveBeenCalled();
  });

  it('rechaza ISAK sin pliegues obligatorios', async () => {
    await request(app.getHttpServer()).post('/api/mediciones-antropometricas')
      .set('Authorization', `Bearer ${tokenFor('usuario')}`).send({ ...basic, protocolo: 'ISAK' }).expect(400);
    expect(prismaMock.medicion_antropometrica.create).not.toHaveBeenCalled();
  });

  it('rechaza BASICA con medidas exclusivas de ISAK', () => {
    return request(app.getHttpServer()).post('/api/mediciones-antropometricas')
      .set('Authorization', `Bearer ${tokenFor('usuario')}`).send({ ...basic, talla_sentado_cm: 90 }).expect(400);
  });

  it('exige versión cuando se selecciona un equipo', () => {
    return request(app.getHttpServer()).post('/api/mediciones-antropometricas')
      .set('Authorization', `Bearer ${tokenFor('usuario')}`).send({ ...basic, id_equipo: 1 }).expect(400);
  });

  it('rechaza una versión de configuración sin equipo', () => {
    return request(app.getHttpServer()).post('/api/mediciones-antropometricas')
      .set('Authorization', `Bearer ${tokenFor('usuario')}`).send({ ...basic, version_protocolo_antropometrico: 1 }).expect(400);
  });

  it('devuelve 409 sin insertar al cambiar la modalidad durante la captura', async () => {
    prismaMock.equipo.updateMany.mockResolvedValue({ count: 0 });
    await request(app.getHttpServer()).post('/api/mediciones-antropometricas')
      .set('Authorization', `Bearer ${tokenFor('usuario')}`)
      .send({ ...basic, id_equipo: 1, version_protocolo_antropometrico: 1 }).expect(409);
    expect(prismaMock.medicion_antropometrica.create).not.toHaveBeenCalled();
  });

  it('rechaza una pertenencia no activa al equipo elegido', async () => {
    prismaMock.jugador_equipo.findFirst.mockResolvedValue(null);
    await request(app.getHttpServer()).post('/api/mediciones-antropometricas')
      .set('Authorization', `Bearer ${tokenFor('usuario')}`)
      .send({ ...basic, id_equipo: 1, version_protocolo_antropometrico: 1 }).expect(400);
    expect(prismaMock.medicion_antropometrica.create).not.toHaveBeenCalled();
  });

  it('solo admin puede configurar la modalidad del equipo', () => {
    return request(app.getHttpServer()).put('/api/equipos/1')
      .set('Authorization', `Bearer ${tokenFor('usuario')}`).send({ protocolo_antropometrico: 'ISAK' }).expect(403);
  });

  it('permite a admin configurar ISAK', async () => {
    await request(app.getHttpServer()).put('/api/equipos/1')
      .set('Authorization', `Bearer ${tokenFor('admin')}`).send({ protocolo_antropometrico: 'ISAK' }).expect(200);
    expect(prismaMock.equipo.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { protocolo_antropometrico: 'ISAK', version_protocolo_antropometrico: { increment: 1 } },
    }));
  });

  it('rechaza modalidades inválidas al configurar el equipo', () => {
    return request(app.getHttpServer()).put('/api/equipos/1')
      .set('Authorization', `Bearer ${tokenFor('admin')}`).send({ protocolo_antropometrico: 'OTRO' }).expect(400);
  });

  it('rechaza null como modalidad al configurar el equipo', () => {
    return request(app.getHttpServer()).put('/api/equipos/1')
      .set('Authorization', `Bearer ${tokenFor('admin')}`).send({ protocolo_antropometrico: null }).expect(400);
  });

  it('no permite modificar la versión desde el cliente', () => {
    return request(app.getHttpServer()).put('/api/equipos/1')
      .set('Authorization', `Bearer ${tokenFor('admin')}`).send({ version_protocolo_antropometrico: 99 }).expect(400);
  });

  it('crea equipos como BASICA por defecto', async () => {
    const response = await request(app.getHttpServer()).post('/api/equipos')
      .set('Authorization', `Bearer ${tokenFor('admin')}`).send({ nombre: 'Equipo', id_temporada: 1 }).expect(201);
    expect(response.body.protocolo_antropometrico).toBe('BASICA');
  });

  it('impide el borrado físico del equipo incluso a admin', async () => {
    await request(app.getHttpServer()).delete('/api/equipos/1')
      .set('Authorization', `Bearer ${tokenFor('admin')}`).expect(409);
    expect(prismaMock.equipo.delete).not.toHaveBeenCalled();
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

describe('Posiciones (e2e)', () => {
  const prismaMock = {
    posicion: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn(),
      create: vi.fn().mockResolvedValue({ id_posicion: 1, nombre: 'Portero', abreviatura: 'POR' }),
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

  it('permite consultar el catálogo a usuarios autenticados', () => {
    return request(app.getHttpServer())
      .get('/api/posiciones')
      .set('Authorization', `Bearer ${tokenFor('usuario')}`)
      .expect(200);
  });

  it('reserva la creación de posiciones a admin', () => {
    return request(app.getHttpServer())
      .post('/api/posiciones')
      .set('Authorization', `Bearer ${tokenFor('usuario')}`)
      .send({ nombre: 'Portero' })
      .expect(403);
  });

  it('permite a admin crear una posición validada', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/posiciones')
      .set('Authorization', `Bearer ${tokenFor('admin')}`)
      .send({ nombre: 'Portero', abreviatura: 'POR' })
      .expect(201);
    expect(response.body).toMatchObject({ id_posicion: 1, nombre: 'Portero' });
  });
});

describe('Posición de plantilla (e2e)', () => {
  const prismaMock = {
    equipo: { findUnique: vi.fn().mockResolvedValue({ id_equipo: 1 }) },
    posicion: { findUnique: vi.fn().mockResolvedValue({ id_posicion: 2, nombre: 'Defensa' }) },
    jugador_equipo: {
      findFirst: vi.fn().mockResolvedValue({ id_jugador_equipo: 10 }),
      update: vi.fn().mockResolvedValue({ id_jugador_equipo: 10, id_posicion: 2 }),
    },
  };
  let app: Awaited<ReturnType<typeof createApp>>;

  beforeAll(async () => {
    app = await createApp(prismaMock);
  });

  afterAll(async () => {
    await app.close();
  });

  it('solo admin puede asignar la posición en una pertenencia activa', async () => {
    await request(app.getHttpServer())
      .patch('/api/equipos/1/plantilla/5/posicion')
      .set('Authorization', `Bearer ${tokenFor('usuario')}`)
      .send({ id_posicion: 2 })
      .expect(403);

    await request(app.getHttpServer())
      .patch('/api/equipos/1/plantilla/5/posicion')
      .set('Authorization', `Bearer ${tokenFor('admin')}`)
      .send({ id_posicion: 2 })
      .expect(200);
    expect(prismaMock.jugador_equipo.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { id_posicion: 2 },
    }));
  });

  it('rechaza un body sin id_posicion', () => {
    return request(app.getHttpServer())
      .patch('/api/equipos/1/plantilla/5/posicion')
      .set('Authorization', `Bearer ${tokenFor('admin')}`)
      .send({})
      .expect(400);
  });
});
