import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateJugadorDto {
  @IsNotEmpty({ message: 'El DNI es obligatorio.' })
  @MaxLength(20)
  dni!: string;

  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @MaxLength(100)
  nombre!: string;

  @IsNotEmpty({ message: 'Los apellidos son obligatorios.' })
  @MaxLength(150)
  apellidos!: string;

  @IsDateString({}, { message: 'La fecha de nacimiento debe ser una fecha válida.' })
  fecha_nacimiento!: string;

  @IsOptional()
  @IsString()
  foto?: string;
}
