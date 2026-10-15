import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';
import { BadRequestException } from '@nestjs/common';
import { PrismaClient, ProtocoloAntropometrico } from '@prisma/client';
import { EquiposService } from '../src/equipos/equipos.service.js';
import { JugadorEquipoService } from '../src/jugador-equipo/jugador-equipo.service.js';
import { MedicionesAntropometricasService } from '../src/mediciones-antropometricas/mediciones-antropometricas.service.js';

const migrationSuite = process.env.TEST_PROTOCOL_MIGRATION === '1' ? describe : describe.skip;

migrationSuite('Protocolos antropometricos: migracion PostgreSQL aislada', () => {
  const schema = `anthropometry_test_${randomUUID().replaceAll('-', '')}`;
  const migration = '20261006160000_protocolos_antropometricos';
  let admin: PrismaClient | undefined;
  let client: PrismaClient;
  let databaseUrl: string;
  let previousMeasurement: Record<string, unknown>;

  function applyMigration(name: string) {
    const result = spawnSync(process.execPath, [
      resolve('node_modules/prisma/build/index.js'), 'db', 'execute',
      '--schema', resolve('prisma/schema.prisma'),
      '--file', resolve('prisma/migrations', name, 'migration.sql'),
    ], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      encoding: 'utf8', timeout: 30_000,
    });
    if (result.status !== 0) {
      throw new Error(`No se pudo aplicar la migracion ${name} en el esquema de prueba.`);
    }
  }

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      loadEnvFile('.env');
    }
    const connection = new URL(process.env.DATABASE_URL!);
    admin = new PrismaClient();
    await admin.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
    connection.searchParams.set('schema', schema);
    databaseUrl = connection.toString();
    client = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

    for (const name of readdirSync('prisma/migrations').filter((name) => name < migration && /^\d/.test(name)).sort()) {
      applyMigration(name);
    }
    await client.$executeRaw`INSERT INTO "rol" ("id_rol", "nombre") VALUES (1, 'usuario')`;
    await client.$executeRaw`INSERT INTO "usuario" ("id_usuario", "nombre", "email", "password_hash", "id_rol")
      VALUES (1, 'Evaluador ficticio', 'test@example.invalid', 'hash-ficticio', 1)`;
    await client.$executeRaw`INSERT INTO "temporada" ("id_temporada", "nombre", "fecha_inicio", "fecha_fin", "estado")
      VALUES (1, 'Prueba', '2026-09-01', '2027-06-30', 'activa')`;
    await client.$executeRaw`INSERT INTO "equipo" ("nombre", "id_temporada", "fecha_creacion")
      VALUES ('Equipo previo', 1, '2026-09-01')`;
    await client.$executeRaw`INSERT INTO "jugador" ("id_jugador", "dni", "nombre", "apellidos", "fecha_nacimiento")
      VALUES (1, 'TEST-1', 'Jugador', 'Ficticio', '2000-01-01')`;
    await client.$executeRaw`INSERT INTO "medicion_antropometrica" (
      "id_jugador", "id_evaluador", "fecha", "peso_kg", "talla_cm",
      "pliegue_tricipital", "pliegue_subescapular", "pliegue_supraespinal",
      "pliegue_abdominal", "pliegue_muslo", "pliegue_pantorrilla",
      "sumatoria_6_pliegues", "porcentaje_grasa", "porcentaje_musculo",
      "somatotipo_endomorfia", "somatotipo_mesomorfia", "somatotipo_ectomorfia", "updated_at")
      VALUES (1, 1, '2026-09-22', 74.5, 178, 8, 10, 7, 12, 11, 7, 777, 12.34, 37.7, 2.1, 4.2, 1.8, '2026-09-22')`;
    [previousMeasurement] = await client.$queryRaw<Record<string, unknown>[]>`SELECT * FROM "medicion_antropometrica"`;
    applyMigration(migration);
    applyMigration('20261008120000_player_positions');
    await client.$disconnect();
    await client.$connect();
  }, 120_000);

  afterAll(async () => {
    await client?.$disconnect();
    if (admin) {
      try {
        await admin.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      } finally {
        await admin.$disconnect();
      }
    }
  }, 30_000);

  it('migra equipos y mediciones como ISAK sin recalcular ni inventar equipo', async () => {
    const [measurement] = await client.$queryRaw<Record<string, unknown>[]>`SELECT * FROM "medicion_antropometrica"`;
    expect(measurement).toEqual({ ...previousMeasurement, protocolo: 'ISAK', id_equipo: null });
    expect(await client.equipo.findUnique({ where: { id_equipo: 1 } })).toMatchObject({
      protocolo_antropometrico: 'ISAK', version_protocolo_antropometrico: 1,
    });
  });

  it('usa BASICA por defecto en equipos nuevos y conserva dos modalidades del mismo jugador', async () => {
    const equipos = new EquiposService(client as never);
    const mediciones = new MedicionesAntropometricasService(client as never);
    const basicTeam = await equipos.create({ id_temporada: 1, nombre: 'Equipo nuevo' });
    expect(basicTeam.protocolo_antropometrico).toBe('BASICA');
    await client.jugador_equipo.createMany({ data: [
      { id_jugador: 1, id_equipo: 1, fecha_inicio: new Date('2026-09-01') },
      { id_jugador: 1, id_equipo: basicTeam.id_equipo, fecha_inicio: new Date('2026-09-01') },
    ] });
    const common = { id_jugador: 1, fecha: '2026-10-06T10:00:00Z', peso_kg: 74.5, talla_cm: 178, version_protocolo_antropometrico: 1 };
    const isak = await mediciones.create({
      ...common, id_equipo: 1, protocolo: ProtocoloAntropometrico.ISAK,
      pliegue_tricipital: 8, pliegue_subescapular: 10, pliegue_supraespinal: 7,
      pliegue_abdominal: 12, pliegue_muslo: 11, pliegue_pantorrilla: 7,
    }, 1);
    const basic = await mediciones.create({ ...common, id_equipo: basicTeam.id_equipo, protocolo: ProtocoloAntropometrico.BASICA }, 1);
    expect(isak).toMatchObject({ protocolo: 'ISAK', id_equipo: 1, porcentaje_grasa: 11.44 });
    expect(basic).toMatchObject({ protocolo: 'BASICA', id_equipo: basicTeam.id_equipo,
      pliegue_tricipital: null, pliegue_subescapular: null, pliegue_supraespinal: null,
      pliegue_abdominal: null, pliegue_muslo: null, pliegue_pantorrilla: null,
      porcentaje_grasa: null, porcentaje_musculo: null, somatotipo_endomorfia: null,
    });
    const before = await mediciones.findByPlayer(1);
    await equipos.update(1, { protocolo_antropometrico: ProtocoloAntropometrico.BASICA });
    await equipos.update(basicTeam.id_equipo, { protocolo_antropometrico: ProtocoloAntropometrico.ISAK });
    expect(await mediciones.findByPlayer(1)).toEqual(before);
  });

  it('protege el vínculo al equipo y evita cascadas desde temporada', async () => {
    await expect(client.equipo.delete({ where: { id_equipo: 1 } })).rejects.toThrow(/medicion_antropometrica_id_equipo_fkey/);
    await expect(client.temporada.delete({ where: { id_temporada: 1 } })).rejects.toThrow(/equipo_id_temporada_fkey/);
    expect(await client.medicion_antropometrica.count()).toBe(3);
  });

  it('persiste la posición preferida y la posición específica de la plantilla', async () => {
    const position = await client.posicion.create({ data: { nombre: 'Posición de prueba', abreviatura: 'PDT' } });
    await client.jugador.update({
      where: { id_jugador: 1 },
      data: { id_posicion_preferida: position.id_posicion },
    });
    await client.jugador_equipo.updateMany({
      where: { id_jugador: 1, id_equipo: 1, activo: true },
      data: { id_posicion: position.id_posicion },
    });

    const roster = await new JugadorEquipoService(client as never).findPlantilla(1);
    expect(roster[0]).toMatchObject({
      posicion: { id_posicion: position.id_posicion, nombre: 'Posición de prueba' },
      jugador: { posicion_preferida: { id_posicion: position.id_posicion } },
    });
    await expect(client.posicion.delete({ where: { id_posicion: position.id_posicion } }))
      .rejects.toThrow(/jugador_id_posicion_preferida_fkey|jugador_equipo_id_posicion_fkey/);
  });

  it('rechaza una medición retrospectiva de una pertenencia finalizada', async () => {
    await client.jugador_equipo.updateMany({ where: { id_jugador: 1 }, data: {
      activo: false, fecha_fin: new Date('2026-10-05'),
    } });
    const mediciones = new MedicionesAntropometricasService(client as never);
    const retrospective = { id_jugador: 1, fecha: '2026-10-04T10:00:00Z',
      protocolo: ProtocoloAntropometrico.BASICA, peso_kg: 74.5, talla_cm: 178 };
    await expect(mediciones.create({ ...retrospective, id_equipo: 1, version_protocolo_antropometrico: 2 }, 1))
      .rejects.toBeInstanceOf(BadRequestException);
    await expect(mediciones.create(retrospective, 1)).rejects.toBeInstanceOf(BadRequestException);
    expect(await client.medicion_antropometrica.count()).toBe(3);
  });
});