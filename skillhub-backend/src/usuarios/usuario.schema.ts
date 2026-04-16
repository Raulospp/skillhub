// src/usuarios/usuario.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UsuarioDocument = Usuario & Document;

@Schema({ timestamps: true })
export class Usuario {

  @Prop({ required: true, trim: true })
  nombre: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  password: string;  // Se guarda hasheada con bcrypt

  @Prop({ default: '' })
  rol: string;  // 'desarrolladora', 'diseñadora', etc.

  @Prop({ default: '' })
  ciudad: string;

  @Prop({ default: '' })
  descripcion: string;

  @Prop({ default: '' })
  website: string;

  @Prop({ default: '' })
  instagram: string;

  @Prop({ default: '' })
  telefono: string;

  // Lo que ofrece (servicios publicados como array embebido)
  @Prop([{
    titulo: String,
    nivel: String,       // 'Básico', 'Intermedio', 'Avanzado', 'Pro'
    categoria: String,   // 'Tecnología', 'Diseño', 'Bienestar'...
    ciudad: String,
    activo: Boolean,
  }])
  serviciosOfrece: Record<string, any>[];

  // Lo que busca aprender
  @Prop([{ titulo: String, anio: Number }])
  serviciosBusca: Record<string, any>[];

  // Reputación
  @Prop({ default: 0 })
  horasAportadas: number;

  @Prop({ default: 0 })
  horasRecibidas: number;

  @Prop({ default: 0 })
  valoracion: number;

  // Estado de cuenta
  @Prop({ default: 'pendiente' })  // 'pendiente' | 'verificado' | 'activo'
  estado: string;

  @Prop()
  fechaNacimiento: Date;

  @Prop({ default: '' })
  documentoIdentidad: string;  // ruta o URL del archivo subido
}

export const UsuarioSchema = SchemaFactory.createForClass(Usuario);
