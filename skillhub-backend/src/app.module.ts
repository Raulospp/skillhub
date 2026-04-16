// src/app.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsuariosModule } from './usuarios/usuarios.module';
import { ServiciosModule } from './servicios/servicios.module';
import { ResenasModule } from './resenas/resenas.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    // ── Conexión a MongoDB Atlas ──────────────────────────────────────
    // Reemplaza <user>, <password> y <cluster> con tus datos de Atlas
    MongooseModule.forRoot(
      process.env.MONGO_URI ||
      'mongodb+srv://<user>:<password>@<cluster>.mongodb.net/skillhub?retryWrites=true&w=majority'
    ),

    // ── Módulos de la app ─────────────────────────────────────────────
    UsuariosModule,
    ServiciosModule,
    ResenasModule,
    AuthModule,
  ],
})
export class AppModule {}
