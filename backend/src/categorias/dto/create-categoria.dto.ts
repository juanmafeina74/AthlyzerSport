import { IsBoolean, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateCategoriaDto {
  @IsNotEmpty({ message: 'El nombre de la categoría es obligatorio.' })
  @MaxLength(50)
  nombre!: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
