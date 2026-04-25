// Ejecutar: npx ts-node server.ts

import 'reflect-metadata';
import {
  Module, Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, Request, Res,
  Injectable, NotFoundException, ConflictException,
  UnauthorizedException, ValidationPipe,
} from '@nestjs/common';
import { NestFactory }           from '@nestjs/core';
import { Response }              from 'express';
import cookieParser              from 'cookie-parser';
import { MongooseModule, InjectModel, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { PassportModule }        from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy }  from 'passport-jwt';
import { Model, Document, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';

const MONGO_URI  = 'mongodb+srv://skillhub_user:skillhub1234@cluster0.mselynh.mongodb.net/skillhub?retryWrites=true&w=majority&appName=Cluster0';
const JWT_SECRET = 'skillhub_secret_2024';

// ══════════════════════════════════════════════════════════════════════════════
//  SCHEMAS  (@Schema + @Prop = decoradores de NestJS/Mongoose)
// ══════════════════════════════════════════════════════════════════════════════

@Schema({ timestamps: true })
export class Usuario {
  @Prop({ required: true })              nombre:        string;
  @Prop({ required: true, unique: true }) email:        string;
  @Prop({ required: true })              password:      string;
  @Prop({ required: true, enum: ['candidata','empresa'] }) tipoUsuario: string;
  @Prop({ default: '' }) genero:         string;
  @Prop({ default: '' }) rol:            string;
  @Prop({ default: '' }) ciudad:         string;
  @Prop({ default: '' }) descripcion:    string;
  @Prop({ default: '' }) avatar:         string;
  @Prop({ default: '' }) instagram:      string;
  @Prop({ default: '' }) telefono:       string;
  @Prop({ default: '' }) website:        string;
  @Prop({ default: '' }) nombreEmpresa:  string;
  @Prop({ default: '' }) sectorEmpresa:  string;
  @Prop([{ titulo: String, nivel: String, categoria: String, ciudad: String }])
  serviciosOfrece: Record<string, any>[];
  @Prop([{ titulo: String, anio: Number }])
  serviciosBusca:  Record<string, any>[];
  @Prop({ default: 0 }) horasAportadas:  number;
  @Prop({ default: 0 }) horasRecibidas:  number;
  @Prop({ default: 0 }) valoracion:      number;
  @Prop({ default: 'activo' }) estado:   string;
}
export type UsuarioDocument = Usuario & Document;
export const UsuarioSchema = SchemaFactory.createForClass(Usuario);

@Schema({ timestamps: true })
export class Oferta {
  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true }) empresaId: Types.ObjectId;
  @Prop({ required: true }) titulo:       string;
  @Prop({ required: true }) descripcion:  string;
  @Prop({ default: '' })    categoria:    string;
  @Prop({ default: '' })    ciudad:       string;
  @Prop({ default: 'Presencial' }) modalidad: string;
  @Prop({ default: '' })    salario:      string;
  @Prop({ default: '' })    requisitos:   string;
  @Prop({ default: 'todas' }) dirigidoA:  string;
  @Prop({ default: 'activa' }) estado:    string;
  @Prop() fechaLimite: Date;
}
export type OfertaDocument = Oferta & Document;
export const OfertaSchema = SchemaFactory.createForClass(Oferta);

@Schema({ timestamps: true })
export class Postulacion {
  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true }) candidataId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Oferta',  required: true }) ofertaId:    Types.ObjectId;
  @Prop({ default: '' })         mensaje: string;
  @Prop({ default: 'pendiente' }) estado: string;
}
export type PostulacionDocument = Postulacion & Document;
export const PostulacionSchema = SchemaFactory.createForClass(Postulacion);

@Schema({ timestamps: true })
export class Mensaje {
  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true }) emisorId:   Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true }) receptorId: Types.ObjectId;
  @Prop({ required: true }) texto: string;
  @Prop({ default: false }) leido: boolean;
}
export type MensajeDocument = Mensaje & Document;
export const MensajeSchema = SchemaFactory.createForClass(Mensaje);

@Schema({ timestamps: true })
export class Resena {
  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true }) autorId:    Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true }) receptorId: Types.ObjectId;
  @Prop({ required: true, min: 1, max: 5 }) puntuacion: number;
  @Prop({ required: true }) comentario: string;
}
export type ResenaDocument = Resena & Document;
export const ResenaSchema = SchemaFactory.createForClass(Resena);

// ══════════════════════════════════════════════════════════════════════════════
//  JWT GUARD  (protege endpoints con @UseGuards(JwtAuthGuard))
// ══════════════════════════════════════════════════════════════════════════════

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // Lee el token desde la cookie HttpOnly en vez del header Authorization
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: any) => req?.cookies?.access_token ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
    });
  }
  async validate(payload: any) {
    return { id: payload.id, email: payload.email, tipoUsuario: payload.tipoUsuario };
  }
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

// ══════════════════════════════════════════════════════════════════════════════
//  SERVICES  (lógica de negocio)
// ══════════════════════════════════════════════════════════════════════════════

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

@Injectable()
export class UsuariosService {
  constructor(@InjectModel(Usuario.name) private model: Model<UsuarioDocument>) {}

  async crear(dto: any) {
    if (await this.model.findOne({ email: dto.email }))
      throw new ConflictException('El email ya está registrado');
    const hash   = await bcrypt.hash(dto.password, 10);
    const nuevo  = new this.model({ ...dto, password: hash });
    const saved  = await nuevo.save();
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
      .populate('ofertaId', 'titulo ciudad modalidad estado')
      .sort({ createdAt: -1 });
  }

  async cambiarEstado(id: string, estado: string) {
    const p = await this.model.findByIdAndUpdate(id, { estado }, { new: true });
    if (!p) throw new NotFoundException('Postulación no encontrada');
    return p;
  }
}

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

// ══════════════════════════════════════════════════════════════════════════════
//  CONTROLLERS  (@Controller, @Get, @Post, @Patch, @Delete)
// ══════════════════════════════════════════════════════════════════════════════

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // POST /api/auth/login → guarda el token en una cookie HttpOnly (no lo manda en el body)
  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token } = await this.authService.login(body.email, body.password);

    // Cookie segura: JS del navegador NO puede leerla
    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: false,       // ponlo en true cuando tengas HTTPS
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });

    return { mensaje: 'Login exitoso' };
  }

  // POST /api/auth/logout → borra la cookie
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token');
    return { mensaje: 'Sesión cerrada' };
  }
}

@Controller('usuarios')
export class UsuariosController {
  constructor(private usuariosService: UsuariosService) {}

  // POST /api/usuarios → Registro
  @Post()
  crear(@Body() dto: any) {
    return this.usuariosService.crear(dto);
  }

  // GET /api/usuarios?tipoUsuario=&genero=&categoria=&ciudad=
  @UseGuards(JwtAuthGuard)
  @Get()
  obtenerTodos(@Query() query: any) {
    return this.usuariosService.obtenerTodos(query);
  }

  // GET /api/usuarios/me → perfil propio desde el JWT
  @UseGuards(JwtAuthGuard)
  @Get('me')
  obtenerMe(@Request() req: any) {
    return this.usuariosService.obtenerMe(req.user.id);
  }

  // PATCH /api/usuarios/me → editar perfil propio
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  actualizarMe(@Request() req: any, @Body() dto: any) {
    return this.usuariosService.actualizar(req.user.id, dto);
  }

  // GET /api/usuarios/:id → ver perfil de otro usuario
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  obtenerPorId(@Param('id') id: string) {
    return this.usuariosService.obtenerPorId(id);
  }

  // PATCH /api/usuarios/:id/identidad → subir doc de identidad
  @Patch(':id/identidad')
  validarIdentidad(@Param('id') id: string, @Body() dto: any) {
    return this.usuariosService.validarIdentidad(id, dto);
  }

  // DELETE /api/usuarios/:id
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  eliminar(@Param('id') id: string) {
    return this.usuariosService.eliminar(id);
  }
}

@UseGuards(JwtAuthGuard)
@Controller('ofertas')
export class OfertasController {
  constructor(private ofertasService: OfertasService) {}

  // POST /api/ofertas → empresa publica oferta
  @Post()
  crear(@Request() req: any, @Body() dto: any) {
    return this.ofertasService.crear(req.user.id, dto);
  }

  // GET /api/ofertas?ciudad=&categoria=&modalidad=&dirigidoA=
  @Get()
  obtenerTodas(@Query() query: any) {
    return this.ofertasService.obtenerTodas(query);
  }

  // GET /api/ofertas/:id
  @Get(':id')
  obtenerPorId(@Param('id') id: string) {
    return this.ofertasService.obtenerPorId(id);
  }

  // PATCH /api/ofertas/:id
  @Patch(':id')
  actualizar(@Param('id') id: string, @Body() dto: any) {
    return this.ofertasService.actualizar(id, dto);
  }

  // DELETE /api/ofertas/:id
  @Delete(':id')
  eliminar(@Param('id') id: string) {
    return this.ofertasService.eliminar(id);
  }
}

@UseGuards(JwtAuthGuard)
@Controller('postulaciones')
export class PostulacionesController {
  constructor(private postulacionesService: PostulacionesService) {}

  // POST /api/postulaciones → candidata aplica
  @Post()
  crear(@Request() req: any, @Body() dto: any) {
    return this.postulacionesService.crear(req.user.id, dto);
  }

  // GET /api/postulaciones?ofertaId=&candidataId=
  @Get()
  obtenerTodas(@Query() query: any) {
    return this.postulacionesService.obtenerTodas(query);
  }

  // PATCH /api/postulaciones/:id → empresa cambia estado
  @Patch(':id')
  cambiarEstado(@Param('id') id: string, @Body('estado') estado: string) {
    return this.postulacionesService.cambiarEstado(id, estado);
  }
}

@UseGuards(JwtAuthGuard)
@Controller('mensajes')
export class MensajesController {
  constructor(private mensajesService: MensajesService) {}

  // POST /api/mensajes
  @Post()
  enviar(@Request() req: any, @Body() dto: any) {
    return this.mensajesService.enviar(req.user.id, dto);
  }

  // GET /api/mensajes/conversaciones
  @Get('conversaciones')
  obtenerConversaciones(@Request() req: any) {
    return this.mensajesService.obtenerConversaciones(req.user.id);
  }

  // GET /api/mensajes?con=userId
  @Get()
  obtenerConversacion(@Request() req: any, @Query('con') con: string) {
    return this.mensajesService.obtenerConversacion(req.user.id, con);
  }
}

@UseGuards(JwtAuthGuard)
@Controller('resenas')
export class ResenasController {
  constructor(private resenasService: ResenasService) {}

  // POST /api/resenas
  @Post()
  crear(@Request() req: any, @Body() dto: any) {
    return this.resenasService.crear(req.user.id, dto);
  }

  // GET /api/resenas?receptorId=
  @Get()
  obtener(@Query('receptorId') receptorId: string) {
    return this.resenasService.obtenerPorReceptor(receptorId);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  APP MODULE  (une todo)
// ══════════════════════════════════════════════════════════════════════════════

@Module({
  imports: [
    MongooseModule.forRoot(MONGO_URI),
    MongooseModule.forFeature([
      { name: Usuario.name,     schema: UsuarioSchema     },
      { name: Oferta.name,      schema: OfertaSchema      },
      { name: Postulacion.name, schema: PostulacionSchema  },
      { name: Mensaje.name,     schema: MensajeSchema     },
      { name: Resena.name,      schema: ResenaSchema      },
    ]),
    PassportModule,
    JwtModule.register({ secret: JWT_SECRET, signOptions: { expiresIn: '7d' } }),
  ],
  controllers: [
    AuthController,
    UsuariosController,
    OfertasController,
    PostulacionesController,
    MensajesController,
    ResenasController,
  ],
  providers: [
    JwtStrategy,
    AuthService,
    UsuariosService,
    OfertasService,
    PostulacionesService,
    MensajesService,
    ResenasService,
  ],
})
export class AppModule {}

// ══════════════════════════════════════════════════════════════════════════════
//  BOOTSTRAP  (arranca el servidor)
// ══════════════════════════════════════════════════════════════════════════════

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Permite leer cookies en los controllers
  app.use(cookieParser());

  // CORS: credentials:true es obligatorio para que el navegador envíe cookies
  app.enableCors({
    origin: true,          // acepta cualquier origen (en producción pon la URL exacta del frontend)
    credentials: true,     // IMPORTANTE: sin esto las cookies no se envían
  });

  const port = 3000;
  await app.listen(port);
  console.log(`\n🚀 SkillHub NestJS corriendo en http://localhost:${port}/api`);
  console.log(`\n   POST   /api/auth/login`);
  console.log(`   POST   /api/usuarios          ← Registro`);
  console.log(`   GET    /api/usuarios/me        ← Perfil propio (JWT)`);
  console.log(`   PATCH  /api/usuarios/me        ← Editar perfil`);
  console.log(`   GET    /api/usuarios/:id       ← Ver otro perfil`);
  console.log(`   POST   /api/ofertas            ← Publicar oferta`);
  console.log(`   GET    /api/ofertas            ← Explorar ofertas`);
  console.log(`   POST   /api/postulaciones      ← Postularme`);
  console.log(`   GET    /api/postulaciones      ← Ver postulaciones`);
  console.log(`   POST   /api/mensajes           ← Enviar mensaje`);
  console.log(`   GET    /api/mensajes           ← Chat`);
  console.log(`   POST   /api/resenas            ← Calificar\n`);
}
bootstrap();