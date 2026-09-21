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
import { TemporadasService } from './temporadas.service.js';
import { CreateTemporadaDto } from './dto/create-temporada.dto.js';
import { UpdateTemporadaDto } from './dto/update-temporada.dto.js';

@Controller('temporadas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TemporadasController {
  constructor(private readonly temporadasService: TemporadasService) {}

  @Get()
  findAll() {
    return this.temporadasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.temporadasService.findOne(id);
  }

  @Post()
  @Roles('admin')
  create(@Body() data: CreateTemporadaDto) {
    return this.temporadasService.create(data);
  }

  @Put(':id')
  @Roles('admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateTemporadaDto) {
    return this.temporadasService.update(id, data);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.temporadasService.remove(id);
  }
}
