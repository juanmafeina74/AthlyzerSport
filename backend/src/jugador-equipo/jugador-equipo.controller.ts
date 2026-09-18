import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { JugadorEquipoService } from './jugador-equipo.service.js';
import { AssignJugadorDto } from './dto/assign-jugador.dto.js';
import { BulkJugadoresDto } from './dto/bulk-jugadores.dto.js';

@Controller('equipos/:idEquipo/plantilla')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JugadorEquipoController {
  constructor(private readonly jugadorEquipoService: JugadorEquipoService) {}

  @Get('disponibles')
  findDisponibles(
    @Param('idEquipo', ParseIntPipe) idEquipo: number,
    @Query('search') search?: string,
  ) {
    return this.jugadorEquipoService.findDisponibles(idEquipo, search);
  }

  @Get()
  findPlantilla(@Param('idEquipo', ParseIntPipe) idEquipo: number) {
    return this.jugadorEquipoService.findPlantilla(idEquipo);
  }

  @Post()
  @Roles('admin')
  assign(@Param('idEquipo', ParseIntPipe) idEquipo: number, @Body() data: AssignJugadorDto) {
    return this.jugadorEquipoService.assign(idEquipo, data.id_jugador, data.dorsal);
  }

  @Post('bulk-assign')
  @Roles('admin')
  bulkAssign(@Param('idEquipo', ParseIntPipe) idEquipo: number, @Body() data: BulkJugadoresDto) {
    return this.jugadorEquipoService.bulkAssign(idEquipo, data.id_jugadores);
  }

  @Post('bulk-remove')
  @Roles('admin')
  bulkRemove(@Param('idEquipo', ParseIntPipe) idEquipo: number, @Body() data: BulkJugadoresDto) {
    return this.jugadorEquipoService.bulkRemove(idEquipo, data.id_jugadores);
  }

  @Delete(':idJugador')
  @Roles('admin')
  remove(
    @Param('idEquipo', ParseIntPipe) idEquipo: number,
    @Param('idJugador', ParseIntPipe) idJugador: number,
  ) {
    return this.jugadorEquipoService.remove(idEquipo, idJugador);
  }
}
