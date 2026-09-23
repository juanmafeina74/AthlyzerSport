import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { JugadoresService } from './jugadores.service.js';
import { CreateJugadorDto } from './dto/create-jugador.dto.js';
import { UpdateJugadorDto } from './dto/update-jugador.dto.js';

type UploadedPhoto = { buffer: Buffer; mimetype: string };

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
  create(@Body() data: CreateJugadorDto) {
    return this.jugadoresService.create(data);
  }

  @Post(':id/foto')
  @Roles('admin')
  @UseInterceptors(
    FileInterceptor('foto', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_request, file, callback) => {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
          callback(new BadRequestException('La foto debe ser JPEG, PNG o WebP.'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  uploadPhoto(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file?: UploadedPhoto,
  ) {
    if (!file) {
      throw new BadRequestException('Debes seleccionar una foto.');
    }
    return this.jugadoresService.updatePhoto(id, file);
  }

  @Put(':id')
  @Roles('admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateJugadorDto) {
    return this.jugadoresService.update(id, data);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.jugadoresService.remove(id);
  }
}
