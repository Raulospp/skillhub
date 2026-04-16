// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefijo global para todas las rutas → /api/usuarios, /api/servicios...
  app.setGlobalPrefix('api');

  // Validación automática de DTOs
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // CORS para que el frontend HTML pueda conectarse
  app.enableCors();

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`SkillHub API corriendo en http://localhost:${port}/api`);
}
bootstrap();
