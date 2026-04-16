// src/servicios/servicio.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ServicioDocument = Servicio & Document;

@Schema({ timestamps: true })
export class Servicio {

  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
  usuarioId: Types.ObjectId;  // quién ofrece el servicio

  @Prop({ required: true })
  titulo: string;  // 'Programación en Python', 'Yoga para principiantes'

  @Prop({ required: true })
  categoria: string;  // 'Tecnología' | 'Diseño' | 'Bienestar' | 'Finanzas' | 'Idiomas' | 'Marketing'

  @Prop({ required: true })
  nivel: string;  // 'Básico' | 'Intermedio' | 'Avanzado' | 'Pro'

  @Prop({ default: '' })
  descripcion: string;

  @Prop({ default: '' })
  ciudad: string;

  @Prop({ default: 'activo' })
  estado: string;  // 'activo' | 'pausado' | 'inactivo'

  @Prop({ default: 0 })
  horasCompartidas: number;

  @Prop({ default: 0 })
  valoracionPromedio: number;

  @Prop([String])
  imagenes: string[];  // URLs de imágenes del servicio
}

export const ServicioSchema = SchemaFactory.createForClass(Servicio);
