import { PartialType } from '@nestjs/mapped-types';
import { CreatePosicionDto } from './create-posicion.dto.js';

export class UpdatePosicionDto extends PartialType(CreatePosicionDto) {}