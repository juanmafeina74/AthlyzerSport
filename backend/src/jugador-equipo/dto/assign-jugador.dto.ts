import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class AssignJugadorDto {
  @IsInt()
  @IsPositive()
  id_jugador!: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  dorsal?: number;
}
