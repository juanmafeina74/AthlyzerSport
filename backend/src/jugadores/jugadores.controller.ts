import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { JugadoresService } from './jugadores.service.js';

@Controller('jugadores')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JugadoresController {
  constructor(private readonly jugadoresService: JugadoresService) {}

  @Get()
  findAll() {
    return this.jugadoresService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.jugadoresService.findOne(id);
  }

  @Post()
  @Roles('admin')
  create(@Body() data: any) {
    return this.jugadoresService.create(data);
  }

  @Put(':id')
  @Roles('admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.jugadoresService.update(id, data);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.jugadoresService.remove(id);
  }
}
