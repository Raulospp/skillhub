import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// ── Usuario ────────────────────────────────────────────────────────────────────
@Schema({ timestamps: true })
export class Usuario {
  @Prop({ required: true })               nombre:              string;
  @Prop({ required: true, unique: true }) email:               string;
  @Prop({ required: true })               password:            string;
  @Prop({ required: true, enum: ['candidata','empresa'] }) tipoUsuario: string;
  @Prop({ default: '' }) genero:              string;
  @Prop({ default: '' }) rol:                 string;
  @Prop({ default: '' }) ciudad:              string;
  @Prop({ default: '' }) descripcion:         string;
  @Prop({ default: '' }) avatar:              string;
  @Prop({ default: '' }) instagram:           string;
  @Prop({ default: '' }) telefono:            string;
  @Prop({ default: '' }) website:             string;
  @Prop({ default: '' }) nombreEmpresa:       string;
  @Prop({ default: '' }) sectorEmpresa:       string;
  @Prop({ default: '' }) tamanoEmpresa:       string;
  @Prop({ default: '' }) inclusion:           string;
  @Prop({ default: '' }) programasDiversidad: string;
  @Prop([{ titulo: String, nivel: String, categoria: String, ciudad: String }])
  serviciosOfrece: Record<string, any>[];
  @Prop([{ titulo: String, anio: Number }])
  serviciosBusca: Record<string, any>[];
  @Prop({ default: 0 }) horasAportadas: number;
  @Prop({ default: 0 }) horasRecibidas: number;
  @Prop({ default: 0 }) valoracion:     number;
  @Prop({ default: 'activo' }) estado:  string;
}
export type UsuarioDocument = Usuario & Document;
export const UsuarioSchema = SchemaFactory.createForClass(Usuario);

// ── Oferta ─────────────────────────────────────────────────────────────────────
@Schema({ timestamps: true })
export class Oferta {
  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true }) empresaId: Types.ObjectId;
  @Prop({ required: true }) titulo:      string;
  @Prop({ required: true }) descripcion: string;
  @Prop({ default: '' })    categoria:   string;
  @Prop({ default: '' })    ciudad:      string;
  @Prop({ default: 'Presencial' }) modalidad: string;
  @Prop({ default: '' })    salario:     string;
  @Prop({ default: '' })    requisitos:  string;
  @Prop({ default: 'todas' }) dirigidoA: string;
  @Prop({ default: 'activa' }) estado:   string;
  @Prop() fechaLimite: Date;
}
export type OfertaDocument = Oferta & Document;
export const OfertaSchema = SchemaFactory.createForClass(Oferta);

// ── Postulacion ────────────────────────────────────────────────────────────────
@Schema({ timestamps: true })
export class Postulacion {
  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true }) candidataId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Oferta',  required: true }) ofertaId:    Types.ObjectId;
  @Prop({ default: '' })          mensaje: string;
  @Prop({ default: 'pendiente' }) estado:  string;
}
export type PostulacionDocument = Postulacion & Document;
export const PostulacionSchema = SchemaFactory.createForClass(Postulacion);

// ── Mensaje ────────────────────────────────────────────────────────────────────
@Schema({ timestamps: true })
export class Mensaje {
  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true }) emisorId:   Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true }) receptorId: Types.ObjectId;
  @Prop({ required: true }) texto: string;
  @Prop({ default: false }) leido: boolean;
}
export type MensajeDocument = Mensaje & Document;
export const MensajeSchema = SchemaFactory.createForClass(Mensaje);

// ── Resena ─────────────────────────────────────────────────────────────────────
@Schema({ timestamps: true })
export class Resena {
  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true }) autorId:    Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true }) receptorId: Types.ObjectId;
  @Prop({ required: true, min: 1, max: 5 }) puntuacion: number;
  @Prop({ required: true }) comentario: string;
}
export type ResenaDocument = Resena & Document;
export const ResenaSchema = SchemaFactory.createForClass(Resena);

// ── Solicitud ──────────────────────────────────────────────────────────────────
@Schema({ timestamps: true })
export class Solicitud {
  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true }) solicitanteId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true }) receptorId:    Types.ObjectId;
  @Prop({ required: true }) habilidadOfrece: string;
  @Prop({ required: true }) habilidadBusca:  string;
  @Prop({ default: '' })    mensaje:          string;
  @Prop({ default: 'pendiente', enum: ['pendiente','aceptada','rechazada'] }) estado: string;
}
export type SolicitudDocument = Solicitud & Document;
export const SolicitudSchema = SchemaFactory.createForClass(Solicitud);

// ── Notificacion ───────────────────────────────────────────────────────────────
@Schema({ timestamps: true })
export class Notificacion {
  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true }) usuarioId: Types.ObjectId;
  @Prop({ required: true }) tipo:   string;
  @Prop({ required: true }) texto:  string;
  @Prop({ default: '' })    enlace: string;
  @Prop({ default: false }) leida:  boolean;
}
export type NotificacionDocument = Notificacion & Document;
export const NotificacionSchema = SchemaFactory.createForClass(Notificacion);

// ── Favorito ───────────────────────────────────────────────────────────────────
@Schema({ timestamps: true })
export class Favorito {
  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true }) usuarioId:    Types.ObjectId;
  @Prop({ type: Types.ObjectId, required: true })                 referenciaId: Types.ObjectId;
  @Prop({ required: true, enum: ['oferta','perfil'] })            tipo:         string;
}
export type FavoritoDocument = Favorito & Document;
export const FavoritoSchema = SchemaFactory.createForClass(Favorito);
