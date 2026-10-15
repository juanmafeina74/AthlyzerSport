import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProtocoloAntropometrico } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { calculateAnthropometricResults } from './antropometria.calculator.js';
import { CreateMedicionAntropometricaDto } from './dto/create-medicion-antropometrica.dto.js';

@Injectable()
export class MedicionesAntropometricasService {
  constructor(private readonly prisma: PrismaService) {}

  async findByPlayer(idJugador: number) {
    await this.ensurePlayerExists(idJugador);

    return this.prisma.medicion_antropometrica.findMany({
      where: { id_jugador: idJugador },
      include: {
        evaluador: { select: { id_usuario: true, nombre: true } },
      },
      orderBy: [{ fecha: 'desc' }, { id_medicion: 'desc' }],
    });
  }

  async create(data: CreateMedicionAntropometricaDto, idEvaluador: number) {
    const { fecha, version_protocolo_antropometrico, ...measurements } = data;
    const measurementDate = fecha ? new Date(fecha) : new Date();
    const measurementDay = new Date(measurementDate);
    measurementDay.setUTCHours(0, 0, 0, 0);
    const calculated = this.calculateResults(data);

    try {
      return await this.prisma.$transaction(async (transaction) => {
        await this.ensurePlayerExists(data.id_jugador, transaction);

        if (data.id_equipo != null) {
          const equipo = await transaction.equipo.findUnique({ where: { id_equipo: data.id_equipo } });
          if (!equipo) {
            throw new NotFoundException(`Equipo ${data.id_equipo} no encontrado`);
          }

          const locked = await transaction.equipo.updateMany({
            where: {
              id_equipo: data.id_equipo,
              protocolo_antropometrico: data.protocolo,
              version_protocolo_antropometrico,
            },
            data: { version_protocolo_antropometrico: { increment: 0 } },
          });
          if (version_protocolo_antropometrico === undefined || locked.count !== 1) {
            throw new ConflictException('La modalidad del equipo ha cambiado. Recarga su configuración antes de registrar la medición.');
          }

          const membership = await transaction.jugador_equipo.findFirst({
            where: {
              id_jugador: data.id_jugador,
              id_equipo: data.id_equipo,
              activo: true,
              fecha_inicio: { lte: measurementDay },
              OR: [{ fecha_fin: null }, { fecha_fin: { gte: measurementDay } }],
            },
          });
          if (!membership) {
            throw new BadRequestException('El jugador debe tener una pertenencia activa al equipo que cubra la fecha de la medición.');
          }
        } else {
          if (version_protocolo_antropometrico !== undefined) {
            throw new BadRequestException('Una medición sin equipo no debe incluir una versión de configuración.');
          }
          const memberships = await transaction.jugador_equipo.findMany({
            where: { id_jugador: data.id_jugador },
            select: { activo: true, fecha_inicio: true, fecha_fin: true },
          });
          if (memberships.some((membership) => membership.activo)) {
            throw new BadRequestException('El jugador tiene equipos activos. Selecciona explícitamente el equipo de la medición.');
          }
          if (memberships.some((membership) =>
            membership.fecha_inicio <= measurementDay &&
            (membership.fecha_fin === null || membership.fecha_fin >= measurementDay))) {
            throw new BadRequestException('No se pueden registrar mediciones de pertenencias ya finalizadas.');
          }
        }

        const createData: Prisma.medicion_antropometricaUncheckedCreateInput = {
          ...measurements,
          ...calculated,
          id_equipo: data.id_equipo ?? null,
          id_evaluador: idEvaluador,
          fecha: measurementDate,
        };
        return transaction.medicion_antropometrica.create({
          data: createData,
          include: {
            jugador: { select: { id_jugador: true, nombre: true, apellidos: true } },
            evaluador: { select: { id_usuario: true, nombre: true } },
          },
        });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
        throw new ConflictException('La configuración o la pertenencia ha cambiado durante el registro. Recarga los datos e inténtalo de nuevo.');
      }
      throw error;
    }
  }

  private calculateResults(data: CreateMedicionAntropometricaDto) {
    if (data.protocolo === ProtocoloAntropometrico.BASICA) {
      const { id_jugador: _idJugador, id_equipo: _idEquipo, protocolo: _protocolo,
        version_protocolo_antropometrico: _version, fecha: _fecha,
        peso_kg: _peso, talla_cm: _talla, perimetro_cintura: _cintura,
        observaciones: _observaciones, ...isakMeasurements } = data;
      if (Object.values(isakMeasurements).some((value) => value !== undefined)) {
        throw new BadRequestException('BASICA solo admite peso, talla, cintura y observaciones como medidas.');
      }
      return {
        sumatoria_6_pliegues: null, sumatoria_8_pliegues: null,
        porcentaje_grasa: null, porcentaje_musculo: null,
        somatotipo_endomorfia: null, somatotipo_mesomorfia: null,
        somatotipo_ectomorfia: null, somatocarta_x: null, somatocarta_y: null,
      };
    }
    if (data.protocolo !== ProtocoloAntropometrico.ISAK) {
      throw new BadRequestException('Debe seleccionar un protocolo BASICA o ISAK.');
    }
    const { pliegue_tricipital, pliegue_subescapular, pliegue_supraespinal,
      pliegue_abdominal, pliegue_muslo, pliegue_pantorrilla } = data;
    if (pliegue_tricipital == null || pliegue_subescapular == null || pliegue_supraespinal == null ||
      pliegue_abdominal == null || pliegue_muslo == null || pliegue_pantorrilla == null) {
      throw new BadRequestException('ISAK requiere los seis pliegues obligatorios.');
    }
    return calculateAnthropometricResults({
      ...data, pliegue_tricipital, pliegue_subescapular, pliegue_supraespinal,
      pliegue_abdominal, pliegue_muslo, pliegue_pantorrilla,
      pliegue_bicipital: data.pliegue_bicipital ?? undefined,
      pliegue_cresta_iliaca: data.pliegue_cresta_iliaca ?? undefined,
      perimetro_brazo_flexionado: data.perimetro_brazo_flexionado ?? undefined,
      perimetro_pantorrilla: data.perimetro_pantorrilla ?? undefined,
      diametro_biepicondilar_humero: data.diametro_biepicondilar_humero ?? undefined,
      diametro_biepicondilar_femur: data.diametro_biepicondilar_femur ?? undefined,
    });
  }

  private async ensurePlayerExists(idJugador: number, client: Prisma.TransactionClient = this.prisma) {
    const player = await client.jugador.findUnique({
      where: { id_jugador: idJugador },
      select: { id_jugador: true },
    });

    if (!player) {
      throw new NotFoundException(`Jugador ${idJugador} no encontrado`);
    }
  }
}