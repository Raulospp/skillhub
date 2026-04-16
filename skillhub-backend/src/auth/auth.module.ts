// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsuariosService } from '../usuarios/usuarios.service';

@Injectable()
export class AuthService {

  constructor(
    private usuariosService: UsuariosService,
    private jwtService: JwtService,
  ) {}

  // POST /api/auth/login  →  Pantalla 1b: Iniciar sesión
  async login(email: string, password: string) {
    const usuario = await this.usuariosService.buscarPorEmail(email);

    if (!usuario) throw new UnauthorizedException('Email o contraseña incorrectos');

    const passwordOk = await bcrypt.compare(password, usuario.password);
    if (!passwordOk) throw new UnauthorizedException('Email o contraseña incorrectos');

    const payload = { sub: usuario._id, email: usuario.email };
    return {
      access_token: this.jwtService.sign(payload),
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        estado: usuario.estado,
      },
    };
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// src/auth/auth.controller.ts
import { Controller, Post, Body } from '@nestjs/common';

@Controller('auth')
export class AuthController {

  constructor(private authService: AuthService) {}

  // POST /api/auth/login
  // Body: { email, password }
  // Respuesta: { access_token, usuario }
  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [
    UsuariosModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'skillhub_secret_2024',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
