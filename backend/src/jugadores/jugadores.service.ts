import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateJugadorDto } from './dto/create-jugador.dto.js';
import { UpdateJugadorDto } from './dto/update-jugador.dto.js';

type UploadedPhoto = { buffer: Buffer; mimetype: string };

@Injectable()
export class JugadoresService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.jugador.findMany({
      orderBy: { id_jugador: 'asc' },
    });
  }

  async findOne(id: number) {
    const jugador = await this.prisma.jugador.findUnique({
      where: { id_jugador: id },
      include: {
        jugador_equipo: {
          include: {
            posicion: true,
            equipo: {
              include: { categoria: true, temporada: true },
            },
          },
          orderBy: { fecha_inicio: 'desc' },
        },
        posicion_preferida: true,
        lesion: { orderBy: { fecha_inicio: 'desc' } },
        medicion_antropometrica: {
          include: { evaluador: { select: { id_usuario: true, nombre: true } } },
          orderBy: [{ fecha: 'desc' }, { id_medicion: 'desc' }],
          take: 5,
        },
      },
    });
    if (!jugador) {
      throw new NotFoundException(`Jugador ${id} no encontrado`);
    }
    return jugador;
  }

  async create(data: CreateJugadorDto) {
    if (data.id_posicion_preferida != null) {
      await this.ensurePositionExists(data.id_posicion_preferida);
    }

    return this.prisma.jugador.create({
      data: {
        dni: data.dni,
        nombre: data.nombre,
        apellidos: data.apellidos,
        fecha_nacimiento: new Date(data.fecha_nacimiento),
        foto: data.foto ?? null,
        id_posicion_preferida: data.id_posicion_preferida ?? null,
      },
      include: { posicion_preferida: true },
    });
  }

  async update(id: number, data: UpdateJugadorDto) {
    await this.findOne(id);

    if (data.id_posicion_preferida != null) {
      await this.ensurePositionExists(data.id_posicion_preferida);
    }

    return this.prisma.jugador.update({
      where: { id_jugador: id },
      data: {
        dni: data.dni,
        nombre: data.nombre,
        apellidos: data.apellidos,
        fecha_nacimiento: data.fecha_nacimiento
          ? new Date(data.fecha_nacimiento)
          : undefined,
        foto: data.foto,
        id_posicion_preferida: data.id_posicion_preferida,
      },
      include: { posicion_preferida: true },
    });
  }

  private async ensurePositionExists(idPosicion: number) {
    const position = await this.prisma.posicion.findUnique({ where: { id_posicion: idPosicion } });
    if (!position) {
      throw new BadRequestException(`La posición ${idPosicion} no existe.`);
    }
  }

  async updatePhoto(id: number, file: UploadedPhoto) {
    const jugador = await this.findOne(id);
    const extensionByMime: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    };
    const fileName = `${randomUUID()}${extensionByMime[file.mimetype]}`;
    const uploadDirectory = path.resolve(process.cwd(), 'uploads/jugadores');
    const filePath = path.join(uploadDirectory, fileName);
    const publicPath = `/uploads/jugadores/${fileName}`;

    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(filePath, file.buffer);

    try {
      const updated = await this.prisma.jugador.update({
        where: { id_jugador: id },
        data: { foto: publicPath },
      });
      await this.removeLocalPhoto(jugador.foto);
      return updated;
    } catch (error) {
      await unlink(filePath).catch(() => undefined);
      throw error;
    }
  }

  async remove(id: number) {
    const jugador = await this.findOne(id);
    const deleted = await this.prisma.jugador.delete({ where: { id_jugador: id } });
    await this.removeLocalPhoto(jugador.foto);
    return deleted;
  }

  private async removeLocalPhoto(photo: string | null) {
    const prefix = '/uploads/jugadores/';
    if (!photo?.startsWith(prefix)) {
      return;
    }

    const fileName = path.basename(photo);
    await unlink(path.resolve(process.cwd(), 'uploads/jugadores', fileName)).catch(() => undefined);
  }
}
