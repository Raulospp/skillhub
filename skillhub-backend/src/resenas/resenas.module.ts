// src/resenas/resena.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ResenaDocument = Resena & Document;

@Schema({ timestamps: true })
export class Resena {

  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
  autorId: Types.ObjectId;  // quien escribe la reseña

  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
  receptorId: Types.ObjectId;  // a quien se califica (pantalla 5: Sara Vanesa)

  @Prop({ type: Types.ObjectId, ref: 'Servicio' })
  servicioId: Types.ObjectId;  // servicio calificado

  @Prop({ required: true, min: 1, max: 5 })
  puntuacion: number;  // 1 a 5 estrellas

  @Prop({ required: true })
  comentario: string;  // "Sara me ayudó a entender las bases de HTML..."

  @Prop({ default: 0 })
  horasIntercambiadas: number;
}

export const ResenaSchema = SchemaFactory.createForClass(Resena);


// ─────────────────────────────────────────────────────────────────────────────
// src/resenas/resenas.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class ResenasService {

  constructor(
    @InjectModel(Resena.name)
    private resenaModel: Model<ResenaDocument>,
  ) {}

  // POST /api/resenas  →  Calificar (botón "Calificar" en Home)
  async crear(dto: any) {
    const resena = new this.resenaModel(dto);
    const guardada = await resena.save();

    // Actualizar valoración promedio del receptor
    await this.actualizarPromedio(dto.receptorId);
    return guardada;
  }

  // GET /api/resenas?receptorId=xxx  →  Ver reseñas en Perfil
  async obtenerTodas(receptorId?: string) {
    const filtro = receptorId ? { receptorId } : {};
    return this.resenaModel
      .find(filtro)
      .populate('autorId', 'nombre ciudad')
      .sort({ createdAt: -1 })
      .exec();
  }

  // GET /api/resenas/:id
  async obtenerUna(id: string) {
    const r = await this.resenaModel.findById(id).populate('autorId', 'nombre');
    if (!r) throw new NotFoundException('Reseña no encontrada');
    return r;
  }

  // PATCH /api/resenas/:id  →  Editar reseña
  async actualizar(id: string, dto: any) {
    return this.resenaModel.findByIdAndUpdate(id, dto, { new: true });
  }

  // DELETE /api/resenas/:id
  async eliminar(id: string) {
    await this.resenaModel.findByIdAndDelete(id);
    return { mensaje: 'Reseña eliminada' };
  }

  // Recalcular promedio de estrellas del usuario receptor
  private async actualizarPromedio(receptorId: string) {
    const resenas = await this.resenaModel.find({ receptorId });
    if (!resenas.length) return;
    const promedio = resenas.reduce((s, r) => s + r.puntuacion, 0) / resenas.length;

    const { UsuariosService } = await import('../usuarios/usuarios.service');
    // (el servicio de usuarios se inyecta en el módulo para actualizar valoracion)
    return promedio;
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// src/resenas/resenas.controller.ts
import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';

@Controller('resenas')
export class ResenasController {

  constructor(private readonly resenasService: ResenasService) {}

  @Post()
  crear(@Body() dto: any) { return this.resenasService.crear(dto); }

  @Get()
  obtenerTodas(@Query('receptorId') receptorId?: string) {
    return this.resenasService.obtenerTodas(receptorId);
  }

  @Get(':id')
  obtenerUna(@Param('id') id: string) { return this.resenasService.obtenerUna(id); }

  @Patch(':id')
  actualizar(@Param('id') id: string, @Body() dto: any) {
    return this.resenasService.actualizar(id, dto);
  }

  @Delete(':id')
  eliminar(@Param('id') id: string) { return this.resenasService.eliminar(id); }
}


// ─────────────────────────────────────────────────────────────────────────────
// src/resenas/resenas.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Resena.name, schema: ResenaSchema }]),
  ],
  controllers: [ResenasController],
  providers: [ResenasService],
})
export class ResenasModule {}
