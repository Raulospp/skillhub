// src/usuarios/usuarios.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Usuario, UsuarioDocument } from './usuario.schema';
import { CrearUsuarioDto, ActualizarUsuarioDto } from './usuario.dto';

@Injectable()
export class UsuariosService {

  constructor(
    @InjectModel(Usuario.name)
    private usuarioModel: Model<UsuarioDocument>,
  ) {}

  // ── CREATE ──────────────────────────────────────────────────────────
  // POST /api/usuarios  →  Pantalla 2 (Registro)
  async crear(dto: CrearUsuarioDto): Promise<Usuario> {
    const existe = await this.usuarioModel.findOne({ email: dto.email });
    if (existe) throw new ConflictException('El email ya está registrado');

    const hash = await bcrypt.hash(dto.password, 10);
    const nuevo = new this.usuarioModel({ ...dto, password: hash });
    return nuevo.save();
  }

  // ── READ ALL ─────────────────────────────────────────────────────────
  // GET /api/usuarios  →  Pantalla 7 (Explorar perfiles)
  async obtenerTodos(categoria?: string): Promise<Usuario[]> {
    const filtro = categoria
      ? { 'serviciosOfrece.categoria': categoria, estado: 'activo' }
      : { estado: 'activo' };

    return this.usuarioModel
      .find(filtro)
      .select('-password -documentoIdentidad')  // no exponer datos sensibles
      .sort({ horasAportadas: -1 })
      .exec();
  }

  // ── READ ONE ──────────────────────────────────────────────────────────
  // GET /api/usuarios/:id  →  Pantallas 5 y 6 (Perfiles)
  async obtenerUno(id: string): Promise<Usuario> {
    const usuario = await this.usuarioModel
      .findById(id)
      .select('-password -documentoIdentidad')
      .exec();

    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return usuario;
  }

  // ── UPDATE ────────────────────────────────────────────────────────────
  // PATCH /api/usuarios/:id  →  Editar perfil propio (Pantalla 5)
  async actualizar(id: string, dto: ActualizarUsuarioDto): Promise<Usuario> {
    const actualizado = await this.usuarioModel
      .findByIdAndUpdate(id, dto, { new: true })
      .select('-password');

    if (!actualizado) throw new NotFoundException('Usuario no encontrado');
    return actualizado;
  }

  // ── DELETE ────────────────────────────────────────────────────────────
  // DELETE /api/usuarios/:id  →  Eliminar cuenta
  async eliminar(id: string): Promise<{ mensaje: string }> {
    const resultado = await this.usuarioModel.findByIdAndDelete(id);
    if (!resultado) throw new NotFoundException('Usuario no encontrado');
    return { mensaje: 'Cuenta eliminada correctamente' };
  }

  // ── VALIDAR IDENTIDAD ─────────────────────────────────────────────────
  // PATCH /api/usuarios/:id/identidad  →  Pantalla 3 (Validación)
  async validarIdentidad(id: string, fechaNacimiento: string, documentoUrl: string) {
    return this.usuarioModel.findByIdAndUpdate(
      id,
      { fechaNacimiento, documentoIdentidad: documentoUrl, estado: 'pendiente' },
      { new: true }
    ).select('-password');
  }

  // Método interno para Auth (no expuesto como endpoint)
  async buscarPorEmail(email: string): Promise<UsuarioDocument | null> {
    return this.usuarioModel.findOne({ email }).exec();
  }
}
