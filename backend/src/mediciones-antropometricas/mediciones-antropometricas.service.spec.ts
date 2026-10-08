import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma, ProtocoloAntropometrico } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EquiposService } from '../equipos/equipos.service.js';
import { CreateMedicionAntropometricaDto } from './dto/create-medicion-antropometrica.dto.js';
import { MedicionesAntropometricasService } from './mediciones-antropometricas.service.js';

const input = {
  id_jugador: 4,
  id_equipo: 1,
  protocolo: ProtocoloAntropometrico.ISAK,
  version_protocolo_antropometrico: 1,
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
    equipo: { findUnique: vi.fn(), updateMany: vi.fn(), update: vi.fn() },
    jugador_equipo: { findFirst: vi.fn(), findMany: vi.fn() },
    medicion_antropometrica: { create: vi.fn(), findMany: vi.fn() },
    $transaction: vi.fn(),
  };
  const service = new MedicionesAntropometricasService(prisma as never);
  const basic = {
    id_jugador: 4, protocolo: ProtocoloAntropometrico.BASICA,
    fecha: input.fecha, peso_kg: 74.5, talla_cm: 178,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    prisma.$transaction.mockImplementation((callback) => callback(prisma));
    prisma.jugador.findUnique.mockResolvedValue({ id_jugador: 4 });
    prisma.equipo.findUnique.mockResolvedValue({ id_equipo: 1, protocolo_antropometrico: 'ISAK', version_protocolo_antropometrico: 1 });
    prisma.equipo.updateMany.mockResolvedValue({ count: 1 });
    prisma.jugador_equipo.findFirst.mockResolvedValue({ activo: true });
    prisma.jugador_equipo.findMany.mockResolvedValue([]);
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

  it('no calcula indicadores en BASICA y admite cintura y observaciones', async () => {
    await service.create({ ...basic, perimetro_cintura: 80, observaciones: 'Control' }, 9);
    expect(prisma.medicion_antropometrica.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        id_equipo: null, protocolo: 'BASICA', id_evaluador: 9,
        perimetro_cintura: 80, observaciones: 'Control',
        porcentaje_grasa: null, porcentaje_musculo: null,
        sumatoria_6_pliegues: null, sumatoria_8_pliegues: null,
        somatotipo_endomorfia: null, somatotipo_mesomorfia: null,
        somatotipo_ectomorfia: null, somatocarta_x: null, somatocarta_y: null,
      }),
    }));
  });

  it('admite selección manual ISAK sin equipo', async () => {
    const { id_equipo: _idEquipo, version_protocolo_antropometrico: _version, ...standalone } = input;
    await service.create(standalone, 9);
    expect(prisma.equipo.updateMany).not.toHaveBeenCalled();
    expect(prisma.medicion_antropometrica.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ id_equipo: null, protocolo: 'ISAK', porcentaje_grasa: 11.44 }),
    }));
  });

  it('rechaza medidas ISAK en BASICA', async () => {
    await expect(service.create({ ...basic, pliegue_tricipital: 8 }, 9)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.medicion_antropometrica.create).not.toHaveBeenCalled();
  });

  it('rechaza un equipo inexistente', async () => {
    prisma.equipo.findUnique.mockResolvedValue(null);
    await expect(service.create(input, 9)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.medicion_antropometrica.create).not.toHaveBeenCalled();
  });

  it('rechaza pertenencias ajenas, finalizadas o que no cubren la fecha', async () => {
    prisma.jugador_equipo.findFirst.mockResolvedValue(null);
    await expect(service.create(input, 9)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.jugador_equipo.findFirst).toHaveBeenCalledWith({ where: {
      id_jugador: 4, id_equipo: 1, activo: true,
      fecha_inicio: { lte: new Date('2026-09-22T00:00:00.000Z') },
      OR: [{ fecha_fin: null }, { fecha_fin: { gte: new Date('2026-09-22T00:00:00.000Z') } }],
    } });
    expect(prisma.medicion_antropometrica.create).not.toHaveBeenCalled();
  });

  it('exige equipo explícito cuando hay varias pertenencias activas', async () => {
    prisma.jugador_equipo.findMany.mockResolvedValue([{ activo: true }, { activo: true }]);
    await expect(service.create(basic, 9)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.medicion_antropometrica.create).not.toHaveBeenCalled();
  });

  it('no permite eludir una pertenencia finalizada omitiendo el equipo', async () => {
    prisma.jugador_equipo.findMany.mockResolvedValue([{
      activo: false, fecha_inicio: new Date('2026-09-01'), fecha_fin: new Date('2026-09-30'),
    }]);
    await expect(service.create(basic, 9)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.medicion_antropometrica.create).not.toHaveBeenCalled();
  });

  it('permite medir sin equipo después de finalizar una pertenencia', async () => {
    prisma.jugador_equipo.findMany.mockResolvedValue([{
      activo: false, fecha_inicio: new Date('2026-09-01'), fecha_fin: new Date('2026-09-20'),
    }]);
    await service.create(basic, 9);
    expect(prisma.medicion_antropometrica.create).toHaveBeenCalled();
  });

  it('rechaza formularios desactualizados incluso si la modalidad vuelve a ser ISAK', async () => {
    prisma.equipo.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.create(input, 9)).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.equipo.updateMany).toHaveBeenCalledWith({
      where: { id_equipo: 1, protocolo_antropometrico: 'ISAK', version_protocolo_antropometrico: 1 },
      data: { version_protocolo_antropometrico: { increment: 0 } },
    });
    expect(prisma.medicion_antropometrica.create).not.toHaveBeenCalled();
  });

  it('traduce un conflicto concurrente a 409', async () => {
    prisma.$transaction.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Conflicto', {
      code: 'P2034', clientVersion: '6.19.3',
    }));
    await expect(service.create(input, 9)).rejects.toBeInstanceOf(ConflictException);
  });

  it('conserva dos mediciones del mismo jugador en equipos de distintas modalidades tras reconfigurarlos', async () => {
    const teams = [
      { id_equipo: 1, protocolo_antropometrico: ProtocoloAntropometrico.ISAK, version_protocolo_antropometrico: 1 },
      { id_equipo: 2, protocolo_antropometrico: ProtocoloAntropometrico.BASICA, version_protocolo_antropometrico: 1 },
    ];
    const history: Record<string, unknown>[] = [];
    prisma.equipo.findUnique.mockImplementation(({ where }) => ({ ...teams.find((team) => team.id_equipo === where.id_equipo) }));
    prisma.equipo.updateMany.mockImplementation(({ where }) => ({ count: teams.filter((team) =>
      team.id_equipo === where.id_equipo && team.protocolo_antropometrico === where.protocolo_antropometrico &&
      team.version_protocolo_antropometrico === where.version_protocolo_antropometrico).length }));
    prisma.equipo.update.mockImplementation(({ where, data }) => {
      const team = teams.find((candidate) => candidate.id_equipo === where.id_equipo)!;
      team.protocolo_antropometrico = data.protocolo_antropometrico;
      team.version_protocolo_antropometrico += data.version_protocolo_antropometrico?.increment ?? 0;
      return { ...team };
    });
    prisma.medicion_antropometrica.create.mockImplementation(({ data }) => {
      const measurement = { id_medicion: history.length + 1, ...data };
      history.push(measurement);
      return measurement;
    });
    prisma.medicion_antropometrica.findMany.mockImplementation(() => history);

    await service.create(input, 9);
    await service.create({ ...basic, id_equipo: 2, version_protocolo_antropometrico: 1 }, 9);
    const original = structuredClone(history);
    const teamsService = new EquiposService(prisma as never);
    await teamsService.update(1, { protocolo_antropometrico: ProtocoloAntropometrico.BASICA });
    await teamsService.update(2, { protocolo_antropometrico: ProtocoloAntropometrico.ISAK });

    expect(await service.findByPlayer(4)).toEqual(original);
    expect(history[0]).toMatchObject({ id_jugador: 4, id_equipo: 1, protocolo: 'ISAK', porcentaje_grasa: 11.44 });
    expect(history[1]).toMatchObject({ id_jugador: 4, id_equipo: 2, protocolo: 'BASICA', porcentaje_grasa: null });
    expect(teams.map((team) => team.version_protocolo_antropometrico)).toEqual([2, 2]);
    await expect(service.create(input, 9)).rejects.toBeInstanceOf(ConflictException);
    expect(history).toHaveLength(2);
  });
});

describe('Contrato de modalidades antropométricas', () => {
  const basic = { id_jugador: 4, protocolo: 'BASICA', peso_kg: 74.5, talla_cm: 178 };

  it('acepta BASICA sin pliegues ni equipo', async () => {
    expect(await validate(plainToInstance(CreateMedicionAntropometricaDto, basic))).toEqual([]);
  });

  it('exige los seis pliegues para ISAK', async () => {
    const errors = await validate(plainToInstance(CreateMedicionAntropometricaDto, { ...basic, protocolo: 'ISAK' }));
    expect(errors.map((error) => error.property)).toEqual([
      'pliegue_tricipital', 'pliegue_subescapular', 'pliegue_supraespinal',
      'pliegue_abdominal', 'pliegue_muslo', 'pliegue_pantorrilla',
    ]);
  });

  it('no admite null como sustituto de un pliegue ISAK', async () => {
    const errors = await validate(plainToInstance(CreateMedicionAntropometricaDto, {
      ...input, protocolo: 'ISAK', pliegue_tricipital: null,
    }));
    expect(errors.map((error) => error.property)).toContain('pliegue_tricipital');
  });

  it('exige la versión cuando se selecciona equipo', async () => {
    const errors = await validate(plainToInstance(CreateMedicionAntropometricaDto, { ...basic, id_equipo: 1 }));
    expect(errors.map((error) => error.property)).toEqual(['version_protocolo_antropometrico']);
  });

  it('rechaza protocolos desconocidos', async () => {
    const errors = await validate(plainToInstance(CreateMedicionAntropometricaDto, { ...basic, protocolo: 'OTRO' }));
    expect(errors.map((error) => error.property)).toContain('protocolo');
  });
});