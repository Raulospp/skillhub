# SkillHub Backend — NestJS + MongoDB

## Instalación

```bash
npm install
cp .env.example .env    # editar con tus credenciales de Atlas
npm run start:dev
```

## Configurar MongoDB Atlas

1. Crear cuenta en https://cloud.mongodb.com
2. Crear un cluster gratuito (M0)
3. Database Access → crear usuario con contraseña
4. Network Access → Add IP Address → Allow from anywhere (0.0.0.0/0)
5. Connect → Drivers → copiar la URI y pegarla en `.env`

---

## Endpoints disponibles

### Auth
| Método | Ruta | Descripción | Pantalla |
|--------|------|-------------|---------|
| POST | /api/auth/login | Iniciar sesión → devuelve JWT | Login |

### Usuarios
| Método | Ruta | Descripción | Pantalla |
|--------|------|-------------|---------|
| POST | /api/usuarios | Crear cuenta | Registro |
| GET | /api/usuarios | Listar perfiles (+ ?categoria=) | Explorar |
| GET | /api/usuarios/:id | Ver perfil | Perfil público/propio |
| PATCH | /api/usuarios/:id | Editar perfil | Perfil propio |
| PATCH | /api/usuarios/:id/identidad | Subir documento | Identidad |
| DELETE | /api/usuarios/:id | Eliminar cuenta | — |

### Servicios
| Método | Ruta | Descripción | Pantalla |
|--------|------|-------------|---------|
| POST | /api/servicios | Publicar servicio | Perfil |
| GET | /api/servicios | Listar (?categoria= ?usuarioId=) | Explorar |
| GET | /api/servicios/:id | Ver servicio | — |
| PATCH | /api/servicios/:id | Editar servicio | Perfil |
| PATCH | /api/servicios/:id/estado | Cambiar estado activo/pausado | Perfil |
| DELETE | /api/servicios/:id | Eliminar servicio | — |

### Reseñas
| Método | Ruta | Descripción | Pantalla |
|--------|------|-------------|---------|
| POST | /api/resenas | Crear reseña/calificación | Home |
| GET | /api/resenas?receptorId= | Ver reseñas de un usuario | Perfil |
| PATCH | /api/resenas/:id | Editar reseña | — |
| DELETE | /api/resenas/:id | Eliminar reseña | — |

---

## Ejemplo: conectar el formulario de Registro al backend

```javascript
// En el HTML del prototipo, reemplazar el onclick del botón de registro:
async function registrar() {
  const res = await fetch('http://localhost:3000/api/usuarios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombre: document.querySelector('#nombre').value,
      email: document.querySelector('#email').value,
      password: document.querySelector('#password').value,
    })
  });
  const data = await res.json();
  if (res.ok) showScreen('screen-identity');
  else alert(data.message);
}
```

## Estructura del proyecto

```
skillhub-backend/
├── src/
│   ├── app.module.ts          ← conexión MongoDB + módulos
│   ├── main.ts                ← arranque, CORS, validación
│   ├── usuarios/
│   │   ├── usuario.schema.ts  ← modelo MongoDB
│   │   ├── usuario.dto.ts     ← validación de datos
│   │   ├── usuarios.service.ts
│   │   ├── usuarios.controller.ts
│   │   └── usuarios.module.ts
│   ├── servicios/
│   │   ├── servicio.schema.ts
│   │   └── servicios.module.ts
│   ├── resenas/
│   │   ├── resena.schema.ts
│   │   └── resenas.module.ts
│   └── auth/
│       └── auth.module.ts
├── .env.example
└── package.json
```
