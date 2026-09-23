import { Body, Controller, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtUser } from '../auth/auth.types.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { CreateMedicionAntropometricaDto } from './dto/create-medicion-antropometrica.dto.js';
import { MedicionesAntropometricasService } from './mediciones-antropometricas.service.js';

type AuthenticatedRequest = Request & { user: JwtUser };

@Controller('mediciones-antropometricas')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'usuario')
export class MedicionesAntropometricasController {
  constructor(private readonly medicionesService: MedicionesAntropometricasService) {}

  @Get('jugador/:idJugador')
  findByPlayer(@Param('idJugador', ParseIntPipe) idJugador: number) {
    return this.medicionesService.findByPlayer(idJugador);
  }

  @Post()
  create(@Body() data: CreateMedicionAntropometricaDto, @Req() request: AuthenticatedRequest) {
    return this.medicionesService.create(data, request.user.id_usuario);
  }
}