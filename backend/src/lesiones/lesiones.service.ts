import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateLesionDto } from './dto/create-lesion.dto.js';
import { FASES_READAPTACION } from './dto/cambiar-fase.dto.js';

@Injectable()
export class LesionesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.lesion.findMany({
      include: { jugador: { select: { id_jugador: true, nombre: true, apellidos: true, foto: true } } },
      orderBy: [{ fecha_inicio: 'desc' }, { id_lesion: 'desc' }],
    });
  }

  async create(data: CreateLesionDto) {
    const jugador = await this.prisma.jugador.findUnique({ where: { id_jugador: data.id_jugador } });
    if (!jugador) throw new NotFoundException(`Jugador ${data.id_jugador} no encontrado`);

    return this.prisma.lesion.create({
      data: {
        id_jugador: data.id_jugador,
        fecha_inicio: new Date(data.fecha_inicio),
        tipo_lesion: data.tipo_lesion.trim(),
        zona_corporal: data.zona_corporal,
        observaciones: data.observaciones?.trim() || null,
      },
      include: { jugador: { select: { id_jugador: true, nombre: true, apellidos: true, foto: true } } },
    });
  }

  async actualizarFase(idLesion: number, nuevaFase: string) {
    if (!FASES_READAPTACION.includes(nuevaFase as typeof FASES_READAPTACION[number])) {
      throw new BadRequestException('Fase de readaptación no válida');
    }
    const lesion = await this.prisma.lesion.findUnique({ where: { id_lesion: idLesion } });
    if (!lesion) throw new NotFoundException(`Lesión ${idLesion} no encontrada`);
    if (lesion.alta_medica) throw new BadRequestException('Una lesión con alta médica no puede volver a readaptación');

    const esAlta = nuevaFase === 'Alta Médica';
    if (esAlta && lesion.fase_readaptacion !== 'Fase 4') {
      throw new BadRequestException('El alta médica requiere completar la Fase 4');
    }

    return this.prisma.lesion.update({
      where: { id_lesion: idLesion },
      data: {
        fase_readaptacion: nuevaFase,
        alta_medica: esAlta,
        fecha_alta_real: esAlta ? new Date() : null,
      },
    });
  }
}