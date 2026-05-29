// Ejecutar: npx ts-node server.ts
import 'reflect-metadata';
import { Module, ValidationPipe } from '@nestjs/common';
import { NestFactory }            from '@nestjs/core';
import { MongooseModule }         from '@nestjs/mongoose';
import { PassportModule }         from '@nestjs/passport';
import { JwtModule }              from '@nestjs/jwt';
const cookieParser = require('cookie-parser');

import { MONGO_URI, JWT_SECRET, PORT } from './src/config';
import { JwtStrategy }                 from './src/guards/jwt.guard';

import {
  UsuarioSchema, OfertaSchema, PostulacionSchema, MensajeSchema,
  ResenaSchema, SolicitudSchema, NotificacionSchema, FavoritoSchema,
  Usuario, Oferta, Postulacion, Mensaje, Resena, Solicitud, Notificacion, Favorito,
} from './src/schemas';

import {
  AuthService, UsuariosService, OfertasService, PostulacionesService,
  MensajesService, ResenasService, NotificacionesService, SolicitudesService, FavoritosService,
} from './src/services';

import {
  AuthController, UsuariosController, OfertasController, PostulacionesController,
  MensajesController, ResenasController, NotificacionesController, SolicitudesController, FavoritosController,
} from './src/controllers';

@Module({
  imports: [
    MongooseModule.forRoot(MONGO_URI),
    MongooseModule.forFeature([
      { name: Usuario.name,      schema: UsuarioSchema      },
      { name: Oferta.name,       schema: OfertaSchema       },
      { name: Postulacion.name,  schema: PostulacionSchema  },
      { name: Mensaje.name,      schema: MensajeSchema      },
      { name: Resena.name,       schema: ResenaSchema       },
      { name: Solicitud.name,    schema: SolicitudSchema    },
      { name: Notificacion.name, schema: NotificacionSchema },
      { name: Favorito.name,     schema: FavoritoSchema     },
    ]),
    PassportModule,
    JwtModule.register({ secret: JWT_SECRET, signOptions: { expiresIn: '7d' } }),
  ],
  controllers: [
    AuthController, UsuariosController, OfertasController,
    PostulacionesController, MensajesController, ResenasController,
    NotificacionesController, SolicitudesController, FavoritosController,
  ],
  providers: [
    JwtStrategy, AuthService, UsuariosService, OfertasService,
    PostulacionesService, MensajesService, ResenasService,
    NotificacionesService, SolicitudesService, FavoritosService,
  ],
})
export class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.use(cookieParser());
  app.enableCors({ origin: true, credentials: true });

  await app.listen(PORT);

  const codespace = process.env.CODESPACE_NAME;
  const domain    = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN || 'app.github.dev';
  const url       = codespace ? `https://${codespace}-${PORT}.${domain}` : `http://localhost:${PORT}`;

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║        SkillHub Backend — NestJS + MongoDB           ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  API: ${url}/api`);
  console.log('╚══════════════════════════════════════════════════════╝\n');
  console.log('  Módulos: auth · usuarios · ofertas · postulaciones');
  console.log('           mensajes · reseñas · notificaciones');
  console.log('           solicitudes · favoritos\n');
}

bootstrap();
