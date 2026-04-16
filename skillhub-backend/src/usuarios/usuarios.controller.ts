// src/usuarios/usuarios.controller.ts
import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CrearUsuarioDto, ActualizarUsuarioDto } from './usuario.dto';

@Controller('usuarios')
export class UsuariosController {

  constructor(private readonly usuariosService: UsuariosService) {}

  // ────────────────────────────────────────────────────────────────────
  //  POST /api/usuarios
  //  Pantalla 2: Registro de nuevo usuario
  //  Body: { nombre, email, password, ciudad?, rol? }
  // ────────────────────────────────────────────────────────────────────
  @Post()
  crear(@Body() dto: CrearUsuarioDto) {
    return this.usuariosService.crear(dto);
  }

  // ────────────────────────────────────────────────────────────────────
  //  GET /api/usuarios
  //  GET /api/usuarios?categoria=Tecnología
  //  Pantalla 7: Explorar perfiles (con filtro opcional por categoría)
  // ────────────────────────────────────────────────────────────────────
  @Get()
  obtenerTodos(@Query('categoria') categoria?: string) {
    return this.usuariosService.obtenerTodos(categoria);
  }

  // ────────────────────────────────────────────────────────────────────
  //  GET /api/usuarios/:id
  //  Pantallas 5 y 6: Ver perfil propio o público
  // ────────────────────────────────────────────────────────────────────
  @Get(':id')
  obtenerUno(@Param('id') id: string) {
    return this.usuariosService.obtenerUno(id);
  }

  // ────────────────────────────────────────────────────────────────────
  //  PATCH /api/usuarios/:id
  //  Pantalla 5: Editar perfil propio (servicios, descripción, contacto)
  // ────────────────────────────────────────────────────────────────────
  @Patch(':id')
  actualizar(@Param('id') id: string, @Body() dto: ActualizarUsuarioDto) {
    return this.usuariosService.actualizar(id, dto);
  }

  // ────────────────────────────────────────────────────────────────────
  //  PATCH /api/usuarios/:id/identidad
  //  Pantalla 3: Subir documento de identidad y fecha de nacimiento
  // ────────────────────────────────────────────────────────────────────
  @Patch(':id/identidad')
  validarIdentidad(
    @Param('id') id: string,
    @Body() body: { fechaNacimiento: string; documentoUrl: string }
  ) {
    return this.usuariosService.validarIdentidad(
      id, body.fechaNacimiento, body.documentoUrl
    );
  }

  // ────────────────────────────────────────────────────────────────────
  //  DELETE /api/usuarios/:id
  //  Eliminar cuenta
  // ────────────────────────────────────────────────────────────────────
  @Delete(':id')
  eliminar(@Param('id') id: string) {
    return this.usuariosService.eliminar(id);
  }
}
