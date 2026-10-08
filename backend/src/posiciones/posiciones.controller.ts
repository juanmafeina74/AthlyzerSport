import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { CreatePosicionDto } from './dto/create-posicion.dto.js';
import { UpdatePosicionDto } from './dto/update-posicion.dto.js';
import { PosicionesService } from './posiciones.service.js';

@Controller('posiciones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PosicionesController {
  constructor(private readonly posicionesService: PosicionesService) {}

  @Get()
  findAll() {
    return this.posicionesService.findAll();
  }

  @Post()
  @Roles('admin')
  create(@Body() data: CreatePosicionDto) {
    return this.posicionesService.create(data);
  }

  @Put(':id')
  @Roles('admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdatePosicionDto) {
    return this.posicionesService.update(id, data);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.posicionesService.remove(id);
  }
}