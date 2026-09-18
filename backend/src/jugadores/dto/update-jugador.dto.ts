import { PartialType } from '@nestjs/mapped-types';
import { CreateJugadorDto } from './create-jugador.dto.js';

export class UpdateJugadorDto extends PartialType(CreateJugadorDto) {}
