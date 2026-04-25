// js/api.js — SkillHub · todas las llamadas al backend

const API = 'https://automatic-orbit-wrjgqpxg4prwfg4q6-3000.app.github.dev/api';

// ── Helpers sesión ─────────────────────────────────────────────────────────────
// El token vive en una cookie HttpOnly que maneja el navegador.
// En localStorage solo guardamos nombre e id para mostrar en la UI.

function getUsuario()   { const u = localStorage.getItem('usuario'); return u ? JSON.parse(u) : null; }
function estaLogueado() { return !!getUsuario(); }

function guardarUsuario(usuario) {
  localStorage.setItem('usuario', JSON.stringify({ ...usuario, id: usuario._id || usuario.id }));
}

function cerrarSesion() {
  localStorage.removeItem('usuario');
  apiFetch(`${API}/auth/logout`, { method: 'POST' }); // borra la cookie en el servidor
  window.location.href = 'index.html';
}

function requireAuth() {
  if (!estaLogueado()) window.location.href = 'login.html';
}

// credentials:'include' le dice al navegador que envíe la cookie en cada request
function apiFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
}

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error del servidor');
  return data;
}

// ── AUTH ───────────────────────────────────────────────────────────────────────
async function login(email, password) {
  // 1. Login → el backend mete el token en la cookie, no nos lo manda
  const res = await apiFetch(`${API}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  await handleResponse(res);

  // 2. Con la cookie ya lista, pedimos los datos del usuario para la UI
  const resMe = await apiFetch(`${API}/usuarios/me`);
  const usuario = await handleResponse(resMe);

  // 3. Guardamos solo nombre e id (NO el token)
  guardarUsuario(usuario);
  return usuario;
}

// ── USUARIOS ───────────────────────────────────────────────────────────────────
async function registro(nombre, email, password, tipoUsuario, genero) {
  const res = await apiFetch(`${API}/usuarios`, {
    method: 'POST',
    body: JSON.stringify({ nombre, email, password, tipoUsuario, genero }),
  });
  return handleResponse(res);
}

async function obtenerMiPerfil() {
  const res = await apiFetch(`${API}/usuarios/me`);
  return handleResponse(res);
}

async function obtenerPerfil(id) {
  // Si hay id en la URL → siempre busca ese usuario específico
  // Si no hay id → busca el perfil propio con /me
  const url = id ? `${API}/usuarios/${id}` : `${API}/usuarios/me`;
  const res = await apiFetch(url);
  return handleResponse(res);
}


async function actualizarPerfil(datos) {
  const res = await apiFetch(`${API}/usuarios/me`, {
    method: 'PATCH',
    body: JSON.stringify(datos),
  });
  return handleResponse(res);
}

async function validarIdentidad(id, fechaNacimiento, documentoUrl) {
  const res = await apiFetch(`${API}/usuarios/${id}/identidad`, {
    method: 'PATCH',
    body: JSON.stringify({ fechaNacimiento, documentoUrl }),
  });
  return handleResponse(res);
}

async function listarUsuarios(filtros = {}) {
  const params = new URLSearchParams();
  if (filtros.tipoUsuario) params.set('tipoUsuario', filtros.tipoUsuario);
  if (filtros.genero)      params.set('genero',      filtros.genero);
  if (filtros.categoria)   params.set('categoria',   filtros.categoria);
  if (filtros.ciudad)      params.set('ciudad',      filtros.ciudad);
  const res = await apiFetch(`${API}/usuarios?${params}`);
  return handleResponse(res);
}

// ── OFERTAS ────────────────────────────────────────────────────────────────────
async function crearOferta(datos) {
  const res = await apiFetch(`${API}/ofertas`, {
    method: 'POST', body: JSON.stringify(datos),
  });
  return handleResponse(res);
}

async function listarOfertas(filtros = {}) {
  const params = new URLSearchParams();
  if (filtros.ciudad)    params.set('ciudad',    filtros.ciudad);
  if (filtros.categoria) params.set('categoria', filtros.categoria);
  if (filtros.modalidad) params.set('modalidad', filtros.modalidad);
  if (filtros.dirigidoA) params.set('dirigidoA', filtros.dirigidoA);
  if (filtros.empresaId) params.set('empresaId', filtros.empresaId);
  const res = await apiFetch(`${API}/ofertas?${params}`);
  return handleResponse(res);
}

async function obtenerOferta(id) {
  const res = await apiFetch(`${API}/ofertas/${id}`);
  return handleResponse(res);
}

async function actualizarOferta(id, datos) {
  const res = await apiFetch(`${API}/ofertas/${id}`, {
    method: 'PATCH', body: JSON.stringify(datos),
  });
  return handleResponse(res);
}

async function eliminarOferta(id) {
  const res = await apiFetch(`${API}/ofertas/${id}`, { method: 'DELETE' });
  return handleResponse(res);
}

// ── POSTULACIONES ──────────────────────────────────────────────────────────────
async function postularme(ofertaId, mensaje) {
  const res = await apiFetch(`${API}/postulaciones`, {
    method: 'POST', body: JSON.stringify({ ofertaId, mensaje }),
  });
  return handleResponse(res);
}

async function obtenerPostulaciones(filtros = {}) {
  const params = new URLSearchParams();
  if (filtros.ofertaId)    params.set('ofertaId',    filtros.ofertaId);
  if (filtros.candidataId) params.set('candidataId', filtros.candidataId);
  const res = await apiFetch(`${API}/postulaciones?${params}`);
  return handleResponse(res);
}

async function cambiarEstadoPostulacion(id, estado) {
  const res = await apiFetch(`${API}/postulaciones/${id}`, {
    method: 'PATCH', body: JSON.stringify({ estado }),
  });
  return handleResponse(res);
}

// ── MENSAJES ───────────────────────────────────────────────────────────────────
async function enviarMensaje(receptorId, texto) {
  const res = await apiFetch(`${API}/mensajes`, {
    method: 'POST', body: JSON.stringify({ receptorId, texto }),
  });
  return handleResponse(res);
}

async function obtenerMensajes(conUserId) {
  const res = await apiFetch(`${API}/mensajes?con=${conUserId}`);
  return handleResponse(res);
}

async function obtenerConversaciones() {
  const res = await apiFetch(`${API}/mensajes/conversaciones`);
  return handleResponse(res);
}

// ── RESEÑAS ────────────────────────────────────────────────────────────────────
async function crearResena(datos) {
  const res = await apiFetch(`${API}/resenas`, {
    method: 'POST', body: JSON.stringify(datos),
  });
  return handleResponse(res);
}

async function obtenerResenas(receptorId) {
  const res = await apiFetch(`${API}/resenas?receptorId=${receptorId}`);
  return handleResponse(res);
}

// ── UI helpers ─────────────────────────────────────────────────────────────────
function mostrarError(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.classList.add('visible'); }
}
function ocultarError(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('visible');
}
function setBtnLoading(btn, loading, texto) {
  if (loading) { btn.disabled = true;  btn.innerHTML = `<span class="spinner"></span> Cargando...`; }
  else         { btn.disabled = false; btn.textContent = texto; }
}
function iniciales(nombre) {
  return nombre ? nombre.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() : '??';
}
function avatarEl(usuario, size = 40) {
  if (usuario?.avatar)
    return `<img src="${usuario.avatar}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;" alt="foto"/>`;
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:linear-gradient(135deg,#c8b8a2,#a08060);display:flex;align-items:center;justify-content:center;font-size:${size*0.35}px;font-weight:600;color:white;">${iniciales(usuario?.nombre)}</div>`;
}