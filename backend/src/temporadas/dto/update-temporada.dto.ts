import { PartialType } from '@nestjs/mapped-types';
import { CreateTemporadaDto } from './create-temporada.dto.js';

export class UpdateTemporadaDto extends PartialType(CreateTemporadaDto) {}
