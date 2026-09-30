import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { CambiarFaseDto } from './dto/cambiar-fase.dto.js';
import { CreateLesionDto } from './dto/create-lesion.dto.js';
import { LesionesService } from './lesiones.service.js';

@Controller('lesiones')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'usuario')
export class LesionesController {
  constructor(private readonly lesionesService: LesionesService) {}

  @Get()
  findAll() {
    return this.lesionesService.findAll();
  }

  @Post()
  create(@Body() data: CreateLesionDto) {
    return this.lesionesService.create(data);
  }

  @Patch(':id/fase')
  cambiarFaseReadaptacion(@Param('id', ParseIntPipe) idLesion: number, @Body() data: CambiarFaseDto) {
    return this.lesionesService.actualizarFase(idLesion, data.fase);
  }
}