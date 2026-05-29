import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, Request, Res,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../guards/jwt.guard';
import {
  AuthService, UsuariosService, OfertasService, PostulacionesService,
  MensajesService, ResenasService, NotificacionesService, SolicitudesService, FavoritosService,
} from '../services';

// ── Auth ───────────────────────────────────────────────────────────────────────
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }, @Res({ passthrough: true }) res: Response) {
    const { access_token } = await this.authService.login(body.email, body.password);
    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { mensaje: 'Login exitoso' };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', { httpOnly: true, secure: true, sameSite: 'none' });
    return { mensaje: 'Sesión cerrada' };
  }
}

// ── Usuarios ───────────────────────────────────────────────────────────────────
@Controller('usuarios')
export class UsuariosController {
  constructor(private usuariosService: UsuariosService) {}

  @Post()
  crear(@Body() dto: any) { return this.usuariosService.crear(dto); }

  @UseGuards(JwtAuthGuard)
  @Get()
  obtenerTodos(@Query() query: any) { return this.usuariosService.obtenerTodos(query); }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  obtenerMe(@Request() req: any) { return this.usuariosService.obtenerMe(req.user.id); }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  actualizarMe(@Request() req: any, @Body() dto: any) { return this.usuariosService.actualizar(req.user.id, dto); }

  @Get(':id')
  obtenerPorId(@Param('id') id: string) { return this.usuariosService.obtenerPorId(id); }

  @Patch(':id/identidad')
  validarIdentidad(@Param('id') id: string, @Body() dto: any) { return this.usuariosService.validarIdentidad(id, dto); }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  eliminar(@Param('id') id: string) { return this.usuariosService.eliminar(id); }
}

// ── Ofertas ────────────────────────────────────────────────────────────────────
@UseGuards(JwtAuthGuard)
@Controller('ofertas')
export class OfertasController {
  constructor(private ofertasService: OfertasService) {}

  @Post()
  crear(@Request() req: any, @Body() dto: any) { return this.ofertasService.crear(req.user.id, dto); }

  @Get()
  obtenerTodas(@Query() query: any) { return this.ofertasService.obtenerTodas(query); }

  @Get(':id')
  obtenerPorId(@Param('id') id: string) { return this.ofertasService.obtenerPorId(id); }

  @Patch(':id')
  actualizar(@Param('id') id: string, @Body() dto: any) { return this.ofertasService.actualizar(id, dto); }

  @Delete(':id')
  eliminar(@Param('id') id: string) { return this.ofertasService.eliminar(id); }
}

// ── Postulaciones ──────────────────────────────────────────────────────────────
@UseGuards(JwtAuthGuard)
@Controller('postulaciones')
export class PostulacionesController {
  constructor(private postulacionesService: PostulacionesService) {}

  @Post()
  crear(@Request() req: any, @Body() dto: any) { return this.postulacionesService.crear(req.user.id, dto); }

  @Get()
  obtenerTodas(@Query() query: any) { return this.postulacionesService.obtenerTodas(query); }

  @Patch(':id')
  cambiarEstado(@Param('id') id: string, @Body('estado') estado: string) { return this.postulacionesService.cambiarEstado(id, estado); }
}

// ── Mensajes ───────────────────────────────────────────────────────────────────
@UseGuards(JwtAuthGuard)
@Controller('mensajes')
export class MensajesController {
  constructor(private mensajesService: MensajesService) {}

  @Post()
  enviar(@Request() req: any, @Body() dto: any) { return this.mensajesService.enviar(req.user.id, dto); }

  @Get('conversaciones')
  obtenerConversaciones(@Request() req: any) { return this.mensajesService.obtenerConversaciones(req.user.id); }

  @Get()
  obtenerConversacion(@Request() req: any, @Query('con') con: string) { return this.mensajesService.obtenerConversacion(req.user.id, con); }
}

// ── Reseñas ────────────────────────────────────────────────────────────────────
@UseGuards(JwtAuthGuard)
@Controller('resenas')
export class ResenasController {
  constructor(private resenasService: ResenasService) {}

  @Post()
  crear(@Request() req: any, @Body() dto: any) { return this.resenasService.crear(req.user.id, dto); }

  @Get()
  obtener(@Query('receptorId') receptorId: string) { return this.resenasService.obtenerPorReceptor(receptorId); }
}

// ── Notificaciones ─────────────────────────────────────────────────────────────
@UseGuards(JwtAuthGuard)
@Controller('notificaciones')
export class NotificacionesController {
  constructor(private notificacionesService: NotificacionesService) {}

  @Get()
  obtenerMias(@Request() req: any) { return this.notificacionesService.obtenerMias(req.user.id); }

  @Get('count')
  contarNoLeidas(@Request() req: any) { return this.notificacionesService.contarNoLeidas(req.user.id); }

  @Patch('leer')
  marcarLeidas(@Request() req: any) { return this.notificacionesService.marcarLeidas(req.user.id); }

  @Patch(':id/leer')
  marcarUnaLeida(@Param('id') id: string) { return this.notificacionesService.marcarUnaLeida(id); }
}

// ── Solicitudes ────────────────────────────────────────────────────────────────
@UseGuards(JwtAuthGuard)
@Controller('solicitudes')
export class SolicitudesController {
  constructor(private solicitudesService: SolicitudesService) {}

  @Post()
  crear(@Request() req: any, @Body() dto: any) { return this.solicitudesService.crear(req.user.id, dto); }

  @Get()
  obtenerMias(@Request() req: any) { return this.solicitudesService.obtenerMias(req.user.id); }

  @Patch(':id')
  cambiarEstado(@Param('id') id: string, @Body('estado') estado: string, @Request() req: any) {
    return this.solicitudesService.cambiarEstado(id, estado, req.user.id);
  }
}

// ── Favoritos ──────────────────────────────────────────────────────────────────
@UseGuards(JwtAuthGuard)
@Controller('favoritos')
export class FavoritosController {
  constructor(private favoritosService: FavoritosService) {}

  @Post('toggle')
  toggle(@Request() req: any, @Body() body: { referenciaId: string; tipo: string }) {
    return this.favoritosService.toggle(req.user.id, body.referenciaId, body.tipo);
  }

  @Get()
  obtenerMios(@Request() req: any, @Query('tipo') tipo: string) { return this.favoritosService.obtenerMios(req.user.id, tipo); }

  @Get('check')
  esFavorito(@Request() req: any, @Query('referenciaId') rid: string, @Query('tipo') tipo: string) {
    return this.favoritosService.esFavorito(req.user.id, rid, tipo);
  }
}
