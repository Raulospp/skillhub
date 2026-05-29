import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import {
  UsuarioDocument, OfertaDocument, PostulacionDocument,
  MensajeDocument, ResenaDocument, SolicitudDocument,
  NotificacionDocument, FavoritoDocument,
  Usuario, Oferta, Postulacion, Mensaje, Resena, Solicitud, Notificacion, Favorito,
} from '../schemas';

// ── Auth ───────────────────────────────────────────────────────────────────────
@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Usuario.name) private usuarioModel: Model<UsuarioDocument>,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const usuario = await this.usuarioModel.findOne({ email });
    if (!usuario) throw new UnauthorizedException('Email o contraseña incorrectos');
    const ok = await bcrypt.compare(password, usuario.password);
    if (!ok)      throw new UnauthorizedException('Email o contraseña incorrectos');
    const payload = { id: (usuario as any)._id, email: usuario.email, tipoUsuario: usuario.tipoUsuario };
    return { access_token: this.jwtService.sign(payload) };
  }
}

// ── Usuarios ───────────────────────────────────────────────────────────────────
@Injectable()
export class UsuariosService {
  constructor(@InjectModel(Usuario.name) private model: Model<UsuarioDocument>) {}

  async crear(dto: any) {
    if (await this.model.findOne({ email: dto.email }))
      throw new ConflictException('El email ya está registrado');
    const hash  = await bcrypt.hash(dto.password, 10);
    const saved = await new this.model({ ...dto, password: hash }).save();
    const { password, ...datos } = (saved as any).toObject();
    return datos;
  }

  async obtenerTodos(query: any) {
    const f: any = {};
    if (query.tipoUsuario) f.tipoUsuario = query.tipoUsuario;
    if (query.genero)      f.genero      = query.genero;
    if (query.categoria)   f['serviciosOfrece.categoria'] = query.categoria;
    if (query.ciudad)      f.ciudad      = new RegExp(query.ciudad, 'i');
    return this.model.find(f).select('-password').sort({ createdAt: -1 });
  }

  async obtenerPorId(id: string) {
    const u = await this.model.findById(id).select('-password');
    if (!u) throw new NotFoundException('Usuario no encontrado');
    return u;
  }

  async obtenerMe(id: string) {
    const u = await this.model.findById(id).select('-password');
    if (!u) throw new NotFoundException('Usuario no encontrado');
    return u;
  }

  async actualizar(id: string, dto: any) {
    delete dto.password; delete dto.email;
    const u = await this.model.findByIdAndUpdate(id, dto, { new: true }).select('-password');
    if (!u) throw new NotFoundException('Usuario no encontrado');
    return u;
  }

  async validarIdentidad(id: string, dto: any) {
    return this.model.findByIdAndUpdate(id,
      { fechaNacimiento: dto.fechaNacimiento, documentoIdentidad: dto.documentoUrl },
      { new: true }
    ).select('-password');
  }

  async eliminar(id: string) {
    await this.model.findByIdAndDelete(id);
    return { mensaje: 'Cuenta eliminada' };
  }

  async actualizarValoracion(id: string, valoracion: number) {
    await this.model.findByIdAndUpdate(id, { valoracion });
  }
}

// ── Ofertas ────────────────────────────────────────────────────────────────────
@Injectable()
export class OfertasService {
  constructor(@InjectModel(Oferta.name) private model: Model<OfertaDocument>) {}

  async crear(empresaId: string, dto: any) {
    return new this.model({ ...dto, empresaId }).save();
  }

  async obtenerTodas(query: any) {
    const f: any = { estado: 'activa' };
    if (query.ciudad)    f.ciudad    = new RegExp(query.ciudad, 'i');
    if (query.categoria) f.categoria = query.categoria;
    if (query.modalidad) f.modalidad = query.modalidad;
    if (query.empresaId) f.empresaId = query.empresaId;
    if (query.dirigidoA && query.dirigidoA !== 'todas')
      f.dirigidoA = { $in: [query.dirigidoA, 'todas'] };
    return this.model.find(f)
      .populate('empresaId', 'nombre avatar ciudad nombreEmpresa sectorEmpresa')
      .sort({ createdAt: -1 });
  }

  async obtenerPorId(id: string) {
    const o = await this.model.findById(id)
      .populate('empresaId', 'nombre avatar ciudad nombreEmpresa sectorEmpresa telefono instagram website');
    if (!o) throw new NotFoundException('Oferta no encontrada');
    return o;
  }

  async actualizar(id: string, dto: any) {
    const o = await this.model.findByIdAndUpdate(id, dto, { new: true });
    if (!o) throw new NotFoundException('Oferta no encontrada');
    return o;
  }

  async eliminar(id: string) {
    await this.model.findByIdAndDelete(id);
    return { mensaje: 'Oferta eliminada' };
  }
}

// ── Postulaciones ──────────────────────────────────────────────────────────────
@Injectable()
export class PostulacionesService {
  constructor(@InjectModel(Postulacion.name) private model: Model<PostulacionDocument>) {}

  async crear(candidataId: string, dto: any) {
    const existe = await this.model.findOne({ candidataId, ofertaId: dto.ofertaId });
    if (existe) throw new ConflictException('Ya te postulaste a esta oferta');
    return new this.model({ ...dto, candidataId }).save();
  }

  async obtenerTodas(query: any) {
    const f: any = {};
    if (query.ofertaId)    f.ofertaId    = query.ofertaId;
    if (query.candidataId) f.candidataId = query.candidataId;
    return this.model.find(f)
      .populate('candidataId', 'nombre avatar rol ciudad descripcion serviciosOfrece genero valoracion telefono instagram')
      .populate('ofertaId', 'titulo ciudad modalidad estado empresaId')
      .sort({ createdAt: -1 });
  }

  async cambiarEstado(id: string, estado: string) {
    const p = await this.model.findByIdAndUpdate(id, { estado }, { new: true });
    if (!p) throw new NotFoundException('Postulación no encontrada');
    return p;
  }
}

// ── Mensajes ───────────────────────────────────────────────────────────────────
@Injectable()
export class MensajesService {
  constructor(@InjectModel(Mensaje.name) private model: Model<MensajeDocument>) {}

  async enviar(emisorId: string, dto: any) {
    const msg = await new this.model({ emisorId, receptorId: dto.receptorId, texto: dto.texto }).save();
    return this.model.findById(msg._id)
      .populate('emisorId', 'nombre avatar')
      .populate('receptorId', 'nombre avatar');
  }

  async obtenerConversacion(yo: string, con: string) {
    const msgs = await this.model.find({
      $or: [{ emisorId: yo, receptorId: con }, { emisorId: con, receptorId: yo }]
    }).populate('emisorId', 'nombre avatar').populate('receptorId', 'nombre avatar').sort({ createdAt: 1 });
    await this.model.updateMany({ emisorId: con, receptorId: yo, leido: false }, { leido: true });
    return msgs;
  }

  async obtenerConversaciones(yo: string) {
    const msgs: any[] = await this.model.find({ $or: [{ emisorId: yo }, { receptorId: yo }] })
      .populate('emisorId', 'nombre avatar tipoUsuario')
      .populate('receptorId', 'nombre avatar tipoUsuario')
      .sort({ createdAt: -1 });
    const map: Record<string, any> = {};
    msgs.forEach(m => {
      const otroId = m.emisorId._id.toString() === yo
        ? m.receptorId._id.toString() : m.emisorId._id.toString();
      if (!map[otroId]) {
        map[otroId] = {
          usuario: m.emisorId._id.toString() === yo ? m.receptorId : m.emisorId,
          ultimoMensaje: m.texto, fecha: m.createdAt, noLeidos: 0,
        };
      }
      if (!m.leido && m.receptorId._id.toString() === yo) map[otroId].noLeidos++;
    });
    return Object.values(map);
  }
}

// ── Reseñas ────────────────────────────────────────────────────────────────────
@Injectable()
export class ResenasService {
  constructor(
    @InjectModel(Resena.name) private model: Model<ResenaDocument>,
    private usuariosService: UsuariosService,
  ) {}

  async crear(autorId: string, dto: any) {
    const resena   = await new this.model({ ...dto, autorId }).save();
    const todas    = await this.model.find({ receptorId: dto.receptorId });
    const promedio = todas.reduce((s, r) => s + r.puntuacion, 0) / todas.length;
    await this.usuariosService.actualizarValoracion(dto.receptorId, promedio);
    return resena;
  }

  async obtenerPorReceptor(receptorId: string) {
    return this.model.find({ receptorId })
      .populate('autorId', 'nombre avatar tipoUsuario')
      .sort({ createdAt: -1 });
  }
}

// ── Notificaciones ─────────────────────────────────────────────────────────────
@Injectable()
export class NotificacionesService {
  constructor(@InjectModel(Notificacion.name) private model: Model<NotificacionDocument>) {}

  async crear(usuarioId: string, tipo: string, texto: string, enlace = '') {
    return new this.model({ usuarioId, tipo, texto, enlace }).save();
  }

  async obtenerMias(usuarioId: string) {
    return this.model.find({ usuarioId }).sort({ createdAt: -1 }).limit(50);
  }

  async contarNoLeidas(usuarioId: string) {
    return this.model.countDocuments({ usuarioId, leida: false });
  }

  async marcarLeidas(usuarioId: string) {
    await this.model.updateMany({ usuarioId, leida: false }, { leida: true });
    return { ok: true };
  }

  async marcarUnaLeida(id: string) {
    await this.model.findByIdAndUpdate(id, { leida: true });
    return { ok: true };
  }
}

// ── Solicitudes ────────────────────────────────────────────────────────────────
@Injectable()
export class SolicitudesService {
  constructor(
    @InjectModel(Solicitud.name) private model: Model<SolicitudDocument>,
    private notificacionesService: NotificacionesService,
  ) {}

  async crear(solicitanteId: string, dto: any) {
    const existe = await this.model.findOne({ solicitanteId, receptorId: dto.receptorId, estado: 'pendiente' });
    if (existe) throw new ConflictException('Ya tienes una solicitud pendiente con este usuario');
    const solicitud = await new this.model({ ...dto, solicitanteId }).save();
    const populated = await this.model.findById(solicitud._id).populate('solicitanteId', 'nombre');
    const nombre = (populated as any).solicitanteId.nombre;
    await this.notificacionesService.crear(
      dto.receptorId, 'solicitud',
      `${nombre} te propone un intercambio: ${dto.habilidadOfrece} ↔ ${dto.habilidadBusca}`,
      `profile.html?id=${solicitanteId}`,
    );
    return solicitud;
  }

  async obtenerMias(usuarioId: string) {
    return this.model.find({ $or: [{ solicitanteId: usuarioId }, { receptorId: usuarioId }] })
      .populate('solicitanteId', 'nombre avatar rol ciudad')
      .populate('receptorId',    'nombre avatar rol ciudad')
      .sort({ createdAt: -1 });
  }

  async cambiarEstado(id: string, estado: string, usuarioId: string) {
    const s = await this.model.findById(id)
      .populate('solicitanteId', 'nombre')
      .populate('receptorId', 'nombre');
    if (!s) throw new NotFoundException('Solicitud no encontrada');
    s.estado = estado as any;
    await (s as any).save();
    const texto = estado === 'aceptada'
      ? `¡Tu solicitud fue aceptada por ${(s.receptorId as any).nombre}!`
      : `Tu solicitud fue rechazada por ${(s.receptorId as any).nombre}.`;
    await this.notificacionesService.crear(
      s.solicitanteId.toString(), estado, texto,
      `profile.html?id=${s.receptorId}`,
    );
    return s;
  }
}

// ── Favoritos ──────────────────────────────────────────────────────────────────
@Injectable()
export class FavoritosService {
  constructor(@InjectModel(Favorito.name) private model: Model<FavoritoDocument>) {}

  async toggle(usuarioId: string, referenciaId: string, tipo: string) {
    const existe = await this.model.findOne({ usuarioId, referenciaId, tipo });
    if (existe) { await this.model.findByIdAndDelete(existe._id); return { guardado: false }; }
    await new this.model({ usuarioId, referenciaId, tipo }).save();
    return { guardado: true };
  }

  async obtenerMios(usuarioId: string, tipo?: string) {
    const f: any = { usuarioId };
    if (tipo) f.tipo = tipo;
    return this.model.find(f).sort({ createdAt: -1 });
  }

  async esFavorito(usuarioId: string, referenciaId: string, tipo: string) {
    const existe = await this.model.findOne({ usuarioId, referenciaId, tipo });
    return { guardado: !!existe };
  }
}
