import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class AssignJugadorDto {
  @IsInt()
  @IsPositive()
  id_jugador!: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  dorsal?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  id_posicion?: number | null;
}
