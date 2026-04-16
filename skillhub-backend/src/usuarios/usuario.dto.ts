// src/usuarios/dto/crear-usuario.dto.ts
import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsString } from 'class-validator';

export class CrearUsuarioDto {
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString()
  nombre: string;

  @IsEmail({}, { message: 'El email no es válido' })
  email: string;

  @MinLength(6, { message: 'La contraseña debe tener mínimo 6 caracteres' })
  password: string;

  @IsOptional()
  @IsString()
  ciudad?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  rol?: string;
}

// src/usuarios/dto/actualizar-usuario.dto.ts
export class ActualizarUsuarioDto {
  @IsOptional() @IsString() nombre?: string;
  @IsOptional() @IsString() ciudad?: string;
  @IsOptional() @IsString() descripcion?: string;
  @IsOptional() @IsString() rol?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() instagram?: string;
  @IsOptional() @IsString() telefono?: string;
  @IsOptional() serviciosOfrece?: any[];
  @IsOptional() serviciosBusca?: any[];
}
