import { ArrayNotEmpty, IsArray, IsInt, IsPositive } from 'class-validator';

export class BulkJugadoresDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  id_jugadores!: number[];
}
