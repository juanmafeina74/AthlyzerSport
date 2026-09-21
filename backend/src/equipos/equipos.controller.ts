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
import { EquiposService } from './equipos.service.js';
import { CreateEquipoDto } from './dto/create-equipo.dto.js';
import { UpdateEquipoDto } from './dto/update-equipo.dto.js';

@Controller('equipos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EquiposController {
  constructor(private readonly equiposService: EquiposService) {}

  @Get()
  findAll() {
    return this.equiposService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.equiposService.findOne(id);
  }

  @Post()
  @Roles('admin')
  create(@Body() data: CreateEquipoDto) {
    return this.equiposService.create(data);
  }

  @Put(':id')
  @Roles('admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateEquipoDto) {
    return this.equiposService.update(id, data);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.equiposService.remove(id);
  }
}
