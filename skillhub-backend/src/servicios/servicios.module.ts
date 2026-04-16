// src/servicios/servicios.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Servicio, ServicioDocument } from './servicio.schema';

@Injectable()
export class ServiciosService {

  constructor(
    @InjectModel(Servicio.name)
    private servicioModel: Model<ServicioDocument>,
  ) {}

  // POST /api/servicios  →  Publicar un nuevo servicio
  async crear(dto: any) {
    const servicio = new this.servicioModel(dto);
    return servicio.save();
  }

  // GET /api/servicios?categoria=Tecnología  →  Pantalla 7 Explorar
  async obtenerTodos(categoria?: string, usuarioId?: string) {
    const filtro: any = { estado: 'activo' };
    if (categoria) filtro.categoria = categoria;
    if (usuarioId) filtro.usuarioId = usuarioId;

    return this.servicioModel
      .find(filtro)
      .populate('usuarioId', 'nombre ciudad valoracion')
      .sort({ horasCompartidas: -1 })
      .exec();
  }

  // GET /api/servicios/:id  →  Ver detalle de un servicio
  async obtenerUno(id: string) {
    const s = await this.servicioModel.findById(id).populate('usuarioId', 'nombre ciudad email');
    if (!s) throw new NotFoundException('Servicio no encontrado');
    return s;
  }

  // PATCH /api/servicios/:id  →  Editar servicio publicado
  async actualizar(id: string, dto: any) {
    const s = await this.servicioModel.findByIdAndUpdate(id, dto, { new: true });
    if (!s) throw new NotFoundException('Servicio no encontrado');
    return s;
  }

  // PATCH /api/servicios/:id/estado  →  Pausar / activar servicio
  async cambiarEstado(id: string, estado: string) {
    return this.servicioModel.findByIdAndUpdate(id, { estado }, { new: true });
  }

  // DELETE /api/servicios/:id  →  Eliminar servicio
  async eliminar(id: string) {
    await this.servicioModel.findByIdAndDelete(id);
    return { mensaje: 'Servicio eliminado' };
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// src/servicios/servicios.controller.ts
import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';

@Controller('servicios')
export class ServiciosController {

  constructor(private readonly serviciosService: ServiciosService) {}

  // POST /api/servicios  →  Publicar servicio
  @Post()
  crear(@Body() dto: any) { return this.serviciosService.crear(dto); }

  // GET /api/servicios | /api/servicios?categoria=Tecnología
  @Get()
  obtenerTodos(
    @Query('categoria') categoria?: string,
    @Query('usuarioId') usuarioId?: string,
  ) { return this.serviciosService.obtenerTodos(categoria, usuarioId); }

  // GET /api/servicios/:id
  @Get(':id')
  obtenerUno(@Param('id') id: string) { return this.serviciosService.obtenerUno(id); }

  // PATCH /api/servicios/:id  →  Editar servicio
  @Patch(':id')
  actualizar(@Param('id') id: string, @Body() dto: any) {
    return this.serviciosService.actualizar(id, dto);
  }

  // PATCH /api/servicios/:id/estado  →  Cambiar estado (activo/pausado)
  @Patch(':id/estado')
  cambiarEstado(@Param('id') id: string, @Body('estado') estado: string) {
    return this.serviciosService.cambiarEstado(id, estado);
  }

  // DELETE /api/servicios/:id
  @Delete(':id')
  eliminar(@Param('id') id: string) { return this.serviciosService.eliminar(id); }
}


// ─────────────────────────────────────────────────────────────────────────────
// src/servicios/servicios.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Servicio, ServicioSchema } from './servicio.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Servicio.name, schema: ServicioSchema }]),
  ],
  controllers: [ServiciosController],
  providers: [ServiciosService],
})
export class ServiciosModule {}
