# SkillHub
**Banco de Habilidades para Mujeres y Jóvenes**

![NestJS](https://img.shields.io/badge/NestJS-TypeScript-E0234E?style=flat&logo=nestjs)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat&logo=mongodb)
![Frontend](https://img.shields.io/badge/Frontend-HTML%20·%20CSS%20·%20JS-F7DF1E?style=flat&logo=javascript)

---

## ¿Qué es SkillHub?

SkillHub es una plataforma web full-stack orientada a empoderar mujeres y jóvenes conectándolos con oportunidades laborales y de intercambio de habilidades. Las empresas publican ofertas, las candidatas se postulan, y cualquier usuario puede proponer intercambios directos de habilidades, chatear en tiempo real y calificar sus experiencias.

---

## Stack tecnológico

- **Backend:** NestJS + TypeScript — patrón Controller → Service → Schema
- **Base de datos:** MongoDB Atlas — 8 colecciones con Mongoose ODM
- **Autenticación:** JWT almacenado en cookie HttpOnly con bcrypt para contraseñas
- **Frontend:** HTML5 + CSS3 + JavaScript vanilla — sin frameworks de UI
- **Entorno de desarrollo:** GitHub Codespaces

---

## Estructura del proyecto

```
skillhub/
├── backend/                    ← NestJS (puerto 3000)
│   ├── server.ts               ← punto de entrada — @Module
│   ├── src/
│   │   ├── config.ts           ← MONGO_URI, JWT_SECRET, PORT
│   │   ├── schemas/index.ts    ← 8 colecciones MongoDB con @Schema
│   │   ├── guards/jwt.guard.ts ← JwtStrategy + JwtAuthGuard
│   │   ├── services/index.ts   ← lógica de negocio
│   │   └── controllers/index.ts← rutas HTTP
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   ← HTML puro (puerto 5500)
│   ├── js/api.js               ← toda la comunicación con el backend
│   ├── css/styles.css          ← sistema de diseño con variables CSS
│   ├── index.html              ← landing pública
│   ├── home.html               ← dashboard principal
│   ├── explore.html            ← explorar candidatas/ofertas/empresas
│   ├── chat.html               ← mensajería en tiempo real
│   └── ... (16 páginas total)
├── .devcontainer/
│   └── devcontainer.json       ← puertos 3000 y 5500 públicos automáticos
└── package.json                ← scripts de inicio
```

---

## Cómo iniciar la aplicación

### Paso 1 — Abrir el Codespace

Ir a `github.com/codespaces` → abrir el Codespace del proyecto. Los puertos 3000 y 5500 se configuran como públicos automáticamente gracias al `.devcontainer/devcontainer.json`.

### Paso 2 — Iniciar el backend

En la **Terminal 1:**

```bash
cd /workspaces/skillhub/backend
npm install
npx ts-node server.ts
```

El backend confirma que está corriendo con el mensaje:

```
╔══════════════════════════════════════════════╗
║      SkillHub Backend — NestJS + MongoDB     ║
║  API: https://...3000.app.github.dev/api     ║
╚══════════════════════════════════════════════╝
```

### Paso 3 — Iniciar el frontend

En la **Terminal 2:**

```bash
cd /workspaces/skillhub/frontend
node start.js
```

El script muestra automáticamente el link público:

```
╔════════════════════════════════════════════════════╗
║           SkillHub — Frontend listo 🚀             ║
║  Abre este link en tu navegador:                   ║
║  https://...5500.app.github.dev                    ║
╚════════════════════════════════════════════════════╝
```

### Paso 4 — Verificar puertos públicos

En la pestaña **Ports** de VS Code verificar que los puertos 3000 y 5500 digan **Public**. Si dicen Private: clic derecho → Port Visibility → Public.

### Commit y push

```bash
cd /workspaces/skillhub
git add .
git commit -m "descripción del cambio"
git push
```

---

## Variables de entorno — `src/config.ts`

```ts
export const MONGO_URI  = 'mongodb+srv://skillhub_user:...@cluster0.../skillhub';
export const JWT_SECRET = 'skillhub_secret_2024';
export const PORT       = 3000;
```

---

## Endpoints principales de la API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Iniciar sesión — genera cookie JWT |
| `POST` | `/api/auth/logout` | Cerrar sesión — borra la cookie |
| `POST` | `/api/usuarios` | Registrar nuevo usuario |
| `GET` | `/api/usuarios/me` | Ver perfil propio (requiere JWT) |
| `GET` | `/api/usuarios/:id` | Ver perfil de cualquier usuario (público) |
| `PATCH` | `/api/usuarios/me` | Editar perfil propio |
| `GET` | `/api/ofertas` | Listar ofertas con filtros |
| `POST` | `/api/ofertas` | Publicar oferta (solo empresas) |
| `POST` | `/api/postulaciones` | Postularse a una oferta |
| `GET` | `/api/postulaciones` | Ver postulaciones por candidata u oferta |
| `PATCH` | `/api/postulaciones/:id` | Aceptar o rechazar postulación |
| `POST` | `/api/mensajes` | Enviar mensaje |
| `GET` | `/api/mensajes/conversaciones` | Lista de conversaciones |
| `GET` | `/api/notificaciones/count` | Número de notificaciones no leídas |
| `POST` | `/api/solicitudes` | Proponer intercambio de habilidades |
| `POST` | `/api/favoritos/toggle` | Guardar o quitar favorito |

---

## Solución de problemas comunes

| Error | Solución |
|-------|----------|
| `401 Unauthorized` | El puerto 3000 está privado o el backend no está corriendo |
| `500 Internal Error` | Un campo nuevo no existe en el `@Schema` de MongoDB — agregar `@Prop` |
| `Failed to fetch` | El Codespace se durmió — reiniciar con `npx ts-node server.ts` |
| Perfil no carga | `sessionStorage` desincronizado — correr `sessionStorage.clear()` en consola |
| Puerto privado | En pestaña Ports → clic derecho → Port Visibility → Public |

---

## Principios de Usabilidad WCAG

Los 4 principios WCAG *(Web Content Accessibility Guidelines)* guían el diseño accesible y usable de la aplicación. A continuación se documenta cómo se implementó cada principio en SkillHub.

---

### 👁 1. Perceptible
> El contenido debe ser visible y perceptible para todos los usuarios.

#### 1.1 Avatares con fallback de iniciales
📍 `js/api.js — avatarEl()`

Si una imagen de perfil no carga o no existe, siempre se muestran las iniciales del nombre. El contenido nunca desaparece ni queda en blanco.

```js
function iniciales(nombre) {
  return nombre.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
}

function avatarEl(usuario, size = 40) {
  if (usuario?.avatar)
    return `<img src='${usuario.avatar}' style='border-radius:50%'/>`;
  // fallback: siempre muestra las iniciales si no hay foto
  return `<div style='background:linear-gradient(...)'>${iniciales(usuario?.nombre)}</div>`;
}
```

#### 1.2 Estados visuales con color Y texto
📍 `mis-postulaciones.html · mis-ofertas.html · solicitudes.html`

Los estados usan color más texto. Nunca depende solo del color — un usuario con daltonismo puede igualmente entender el estado.

```css
.estado-pendiente  { background: #fff8e1; color: #b45309; } /* amarillo */
.estado-aceptada   { background: #e8f5e9; color: #2e7d32; } /* verde   */
.estado-rechazada  { background: #fde8e8; color: #c62828; } /* rojo    */
```

#### 1.3 Badges de notificaciones y mensajes
📍 `home.html — cargarBadges()`

Los íconos del navbar muestran un número rojo cuando hay contenido pendiente. La información importante siempre está visible.

```js
async function cargarBadges() {
  const count = await contarNotificaciones();
  const badge = document.getElementById('badge-notif');
  badge.style.display = count > 0 ? 'block' : 'none';
  badge.textContent   = count > 9 ? '9+' : count;
}
setInterval(cargarBadges, 15000);
```

#### 1.4 Loading states y empty states
📍 `explore.html · solicitudes.html · mis-postulaciones.html`

Mientras cargan los datos se muestra `Cargando...` y cuando no hay resultados se muestra un mensaje útil con acción. Nunca hay pantallas vacías.

```js
// Estado vacío con acción sugerida
document.getElementById('lista').innerHTML = `
  <div class='empty-state'>
    <div class='emoji'>📋</div>
    <p>No te has postulado a ninguna oferta aún</p>
    <a href='explore.html'>Ver ofertas disponibles →</a>
  </div>`;
```

#### 1.5 Contraste de colores
📍 `css/styles.css — variables CSS`

```css
:root {
  --black:    #111111;  /* texto principal — alto contraste */
  --bg:       #f5f4f1;  /* fondo general — cálido y legible */
  --white:    #ffffff;  /* tarjetas y formularios           */
  --gray-text:#6b7280;  /* texto secundario                 */
}
```

---

### 🖱 2. Operable
> El usuario debe poder navegar e interactuar sin problemas y sin trampas.

#### 2.1 Enter para enviar en el chat
📍 `chat.html — evento keydown`

```js
textarea.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault(); // evita el salto de línea
    enviar();
  }
  // Shift+Enter → salto de línea normal
});
```

#### 2.2 Enter para hacer login
📍 `login.html — evento keydown global`

```js
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') doLogin();
});
```

#### 2.3 Botones deshabilitados durante carga
📍 `js/api.js — setBtnLoading()`

Cuando se procesa una acción, el botón se deshabilita y muestra `Cargando...` para evitar doble envío.

```js
function setBtnLoading(btn, loading, texto) {
  if (loading) {
    btn.disabled = true;
    btn.innerHTML = `<span class='spinner'></span> Cargando...`;
  } else {
    btn.disabled = false;
    btn.textContent = texto;
  }
}
```

#### 2.4 Navbar sticky siempre disponible
📍 `css/styles.css — .navbar`

```css
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--white);
  border-bottom: 1px solid #e0ddd8;
}
```

#### 2.5 requireAuth() — protección automática
📍 `js/api.js · todas las páginas privadas`

Cada página privada llama `requireAuth()` como primera línea. Si no hay sesión, redirige al login inmediatamente.

```js
function requireAuth() {
  if (!estaLogueado()) window.location.href = 'login.html';
}
```

#### 2.6 Tabs para filtrar sin recargar
📍 `explore.html · solicitudes.html · mis-postulaciones.html`

```js
function cambiarTab(tab) {
  tabActual = tab;
  document.getElementById('tab-perfiles').classList.toggle('active', tab==='perfiles');
  document.getElementById('tab-ofertas').classList.toggle('active',  tab==='ofertas');
  document.getElementById('tab-empresas').classList.toggle('active', tab==='empresas');
  cargar();
}
```

---

### 💡 3. Comprensible
> El contenido y el funcionamiento deben ser fáciles de entender.

#### 3.1 Mensajes de error específicos del backend
📍 `js/api.js — handleResponse() · src/services/index.ts`

```js
// Propaga el mensaje exacto del backend al usuario
async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error del servidor');
  return data;
}

// Mensajes claros desde el backend
if (!usuario) throw new UnauthorizedException('Email o contraseña incorrectos');
if (existe)   throw new ConflictException('Ya te postulaste a esta oferta');
if (!u)       throw new NotFoundException('Usuario no encontrado');
```

#### 3.2 Formularios con placeholders descriptivos
📍 `register.html · edit-profile.html · nueva-oferta.html`

```html
<input type='text'  placeholder='Ana García'/>
<input type='email' placeholder='ana@email.com'/>
<input type='text'  placeholder='Ej: Desarrolladora Frontend Junior'/>
<input type='text'  placeholder='3207655665'/>
<input type='text'  placeholder='tu_usuario (sin @)'/>
```

#### 3.3 Tiempo relativo en notificaciones y chat
📍 `notificaciones.html · chat.html`

En vez de fechas técnicas, se muestra tiempo relativo: `Ahora mismo`, `Hace 5 min`, `Ayer`.

```js
function tiempoRelativo(fecha) {
  const diff = Date.now() - new Date(fecha).getTime();
  const min  = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const dias = Math.floor(diff / 86400000);
  if (min  <  1) return 'Ahora mismo';
  if (min  < 60) return `Hace ${min} min`;
  if (hrs  < 24) return `Hace ${hrs} h`;
  if (dias <  7) return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
  return new Date(fecha).toLocaleDateString('es', { day:'numeric', month:'short' });
}
```

#### 3.4 Hero diferente según tipo de usuario
📍 `home.html — init()`

```js
async function init() {
  const perfil = await obtenerMiPerfil();
  if (perfil.tipoUsuario === 'empresa') {
    document.getElementById('hero-candidata').style.display = 'none';
    document.getElementById('hero-empresa').style.display   = 'flex';
    document.getElementById('btn-publicar').style.display   = 'inline-flex';
  } else {
    document.getElementById('hero-candidata').style.display = 'flex';
  }
}
```

#### 3.5 Registro multi-paso para empresas
📍 `register.html — setStep()`

El formulario de empresa se divide en pasos con barra de progreso. El usuario sabe en qué paso está y cuántos faltan.

```js
function setStep(n) {
  document.querySelectorAll('.step-form').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.step-dot').forEach((d,i) =>
    d.classList.toggle('active', i < n)
  );
  document.getElementById('progress').style.width = (n/3*100)+'%';
}
```

#### 3.6 Mensajes contextuales al aceptar o rechazar
📍 `mis-postulaciones.html`

```js
${p.estado === 'aceptada' ? `
  <div style='background:#e8f5e9;padding:10px;border-radius:8px;'>
    🎉 ¡Felicitaciones! Tu postulación fue <strong>aceptada</strong>.
    La empresa puede contactarte pronto.
  </div>` : ''}

${p.estado === 'rechazada' ? `
  <div style='background:#fde8e8;padding:10px;border-radius:8px;'>
    Tu postulación no fue seleccionada. ¡Sigue intentando!
  </div>` : ''}
```

---

### 🔒 4. Robusto
> El contenido debe funcionar en diferentes contextos sin romperse.

#### 4.1 sessionStorage como fallback de navegación
📍 `explore.html · profile.html · oferta-detail.html`

Codespaces elimina los query params (`?id=xxx`) al navegar entre páginas. La solución usa `sessionStorage` como respaldo.

```js
// explore.html — guarda el ID antes de navegar
return `<a class='pcard'
  href='profile.html?id=${u._id}'
  onclick="sessionStorage.setItem('verPerfilId','${u._id}')"
>`;

// profile.html — lee URL o sessionStorage como respaldo
const params = new URLSearchParams(window.location.search);
const urlId  = params.get('id') || sessionStorage.getItem('verPerfilId');
sessionStorage.removeItem('verPerfilId'); // limpiar siempre después de leer
const esPropio = !urlId; // si no hay ID → perfil propio
```

#### 4.2 select('-password') en todas las consultas
📍 `src/services/index.ts — UsuariosService`

La contraseña hasheada nunca llega al frontend, sin importar el flujo.

```ts
async obtenerTodos(query: any) {
  return this.model.find(f).select('-password').sort({ createdAt: -1 });
}

async obtenerPorId(id: string) {
  const u = await this.model.findById(id).select('-password');
  if (!u) throw new NotFoundException('Usuario no encontrado');
  return u;
}

// También en el registro
const { password, ...datos } = saved.toObject();
return datos; // nunca devuelve el hash
```

#### 4.3 Validación de duplicados antes de crear
📍 `src/services/index.ts — PostulacionesService · SolicitudesService`

```ts
async crear(candidataId: string, dto: any) {
  const existe = await this.model.findOne({ candidataId, ofertaId: dto.ofertaId });
  if (existe) throw new ConflictException('Ya te postulaste a esta oferta');
  return new this.model({ ...dto, candidataId }).save();
}

// SolicitudesService — misma lógica
const existe = await this.model.findOne({
  solicitanteId, receptorId: dto.receptorId, estado: 'pendiente'
});
if (existe) throw new ConflictException('Ya tienes una solicitud pendiente');
```

#### 4.4 Cookie con expiración de 7 días
📍 `src/controllers/index.ts — AuthController`

```ts
res.cookie('access_token', access_token, {
  httpOnly: true,                    // JS del navegador NO puede leerla
  secure: true,                      // solo viaja por HTTPS
  sameSite: 'none',                  // permite cookies cross-origin
  maxAge: 7 * 24 * 60 * 60 * 1000,  // expira en 7 días automáticamente
});
```

#### 4.5 clearInterval en el chat
📍 `chat.html — abrirChat()`

Cuando el usuario cambia de conversación, el intervalo anterior se cancela antes de crear uno nuevo. Previene acumulación de peticiones.

```js
let interval = null;

async function abrirChat(usuario) {
  conActual = usuario;
  clearInterval(interval); // cancela el polling anterior
  await cargarMensajes();
  interval = setInterval(cargarMensajes, 3000);
}
```

#### 4.6 Hash de mensajes para evitar re-renders innecesarios
📍 `chat.html — cargarMensajes()`

```js
let ultimosMsgs = '';

async function cargarMensajes() {
  const msgs = await obtenerMensajes(conActual._id);
  const hash = msgs.map(m => m._id).join();

  if (hash === ultimosMsgs) return; // sin cambios — no actualizar el DOM
  ultimosMsgs = hash;

  renderizarMensajes(msgs);
}
```

#### 4.7 CORS configurado correctamente
📍 `backend/server.ts — bootstrap()`

```ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({
    origin: true,
    credentials: true, // OBLIGATORIO para cookies cross-origin
  });
  await app.listen(PORT);
}
```

---

## Resumen WCAG

| Principio | Implementación clave | Archivo |
|-----------|---------------------|---------|
| 👁 Perceptible | Avatares con fallback de iniciales | `js/api.js — avatarEl()` |
| 👁 Perceptible | Estados con color + texto | `css/styles.css — .estado-*` |
| 👁 Perceptible | Badges de notificaciones | `home.html — cargarBadges()` |
| 👁 Perceptible | Loading y empty states | `explore.html · solicitudes.html` |
| 🖱 Operable | Enter para enviar mensaje | `chat.html — keydown` |
| 🖱 Operable | Botones deshabilitados al cargar | `js/api.js — setBtnLoading()` |
| 🖱 Operable | Navbar sticky | `css/styles.css — .navbar` |
| 🖱 Operable | Tabs sin recargar página | `explore.html — cambiarTab()` |
| 💡 Comprensible | Errores específicos del backend | `js/api.js — handleResponse()` |
| 💡 Comprensible | Tiempo relativo | `chat.html · notificaciones.html` |
| 💡 Comprensible | Hero según tipo de usuario | `home.html — init()` |
| 💡 Comprensible | Registro multi-paso | `register.html — setStep()` |
| 🔒 Robusto | sessionStorage de navegación | `profile.html · explore.html` |
| 🔒 Robusto | select('-password') siempre | `src/services/index.ts` |
| 🔒 Robusto | Validación de duplicados | `src/services — PostulacionesService` |
| 🔒 Robusto | Cookie con expiración 7 días | `src/controllers — AuthController` |
| 🔒 Robusto | clearInterval en chat | `chat.html — abrirChat()` |
