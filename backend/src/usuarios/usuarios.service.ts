import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';

const SALT_ROUNDS = 12;

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const usuarios = await this.prisma.usuario.findMany({
      include: { rol: true },
      orderBy: { id_usuario: 'asc' },
    });

    return usuarios.map((usuario) => this.toResponse(usuario));
  }

  async findOne(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id_usuario: id },
      include: { rol: true },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario ${id} no encontrado`);
    }

    return this.toResponse(usuario);
  }

  async create(data: any) {
    this.validateRequiredText(data.nombre, 'El nombre es obligatorio.');
    this.validateRequiredText(data.email, 'El email es obligatorio.');
    this.validateRequiredText(data.password, 'La contraseña es obligatoria.');

    const rol = await this.findRole(data.id_rol);

    const usuario = await this.prisma.usuario.create({
      data: {
        nombre: data.nombre.trim(),
        email: data.email.trim().toLowerCase(),
        password_hash: await bcrypt.hash(data.password.trim(), SALT_ROUNDS),
        id_rol: rol.id_rol,
        activo: Boolean(data.activo),
      },
      include: { rol: true },
    });

    return this.toResponse(usuario);
  }

  async update(id: number, data: any) {
    await this.findOne(id);

    const updateData: any = {};

    if (data.nombre !== undefined) {
      this.validateRequiredText(data.nombre, 'El nombre es obligatorio.');
      updateData.nombre = data.nombre.trim();
    }

    if (data.email !== undefined) {
      this.validateRequiredText(data.email, 'El email es obligatorio.');
      updateData.email = data.email.trim().toLowerCase();
    }

    if (data.password !== undefined && data.password.trim()) {
      updateData.password_hash = await bcrypt.hash(data.password.trim(), SALT_ROUNDS);
    }

    if (data.id_rol !== undefined) {
      const rol = await this.findRole(data.id_rol);
      updateData.id_rol = rol.id_rol;
    }

    if (data.activo !== undefined) {
      updateData.activo = Boolean(data.activo);
    }

    const usuario = await this.prisma.usuario.update({
      where: { id_usuario: id },
      data: updateData,
      include: { rol: true },
    });

    return this.toResponse(usuario);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.usuario.delete({ where: { id_usuario: id } });
    return { deleted: true };
  }

  async findRoles() {
    return this.prisma.rol.findMany({ orderBy: { nombre: 'asc' } });
  }

  private async findRole(id: number | string) {
    const roleId = Number(id);

    if (!Number.isInteger(roleId)) {
      throw new BadRequestException('El rol es obligatorio.');
    }

    const rol = await this.prisma.rol.findUnique({ where: { id_rol: roleId } });

    if (!rol) {
      throw new BadRequestException('El rol seleccionado no existe.');
    }

    return rol;
  }

  private validateRequiredText(value: unknown, message: string) {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(message);
    }
  }

  private toResponse(usuario: any) {
    return {
      id_usuario: usuario.id_usuario,
      nombre: usuario.nombre,
      email: usuario.email,
      activo: usuario.activo,
      id_rol: usuario.id_rol,
      role: usuario.rol.nombre,
    };
  }
}
