// js/api.js — SkillHub · todas las llamadas al backend

const API = 'https://automatic-orbit-wrjgqpxg4prwfg4q6-3000.app.github.dev/api';

// ── Helpers sesión ────────────────────────────────────────────────────────────
function getToken()    { return localStorage.getItem('access_token'); }
function getUsuario()  { const u = localStorage.getItem('usuario'); return u ? JSON.parse(u) : null; }
function estaLogueado(){ return !!getToken(); }

function guardarSesion(data) {
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('usuario', JSON.stringify(data.usuario));
}

function cerrarSesion() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('usuario');
  window.location.href = 'index.html';
}

function requireAuth() {
  if (!estaLogueado()) window.location.href = 'login.html';
}

function authHeaders() {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` };
}

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error del servidor');
  return data;
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
async function login(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await handleResponse(res);
  guardarSesion(data);
  return data;
}

// ── USUARIOS ──────────────────────────────────────────────────────────────────
async function registro(nombre, email, password, tipoUsuario, genero) {
  const res = await fetch(`${API}/usuarios`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, email, password, tipoUsuario, genero }),
  });
  return handleResponse(res);
}

async function obtenerPerfil(id) {
  const res = await fetch(`${API}/usuarios/${id}`, { headers: authHeaders() });
  return handleResponse(res);
}

async function actualizarPerfil(id, datos) {
  const res = await fetch(`${API}/usuarios/${id}`, {
    method: 'PATCH', headers: authHeaders(), body: JSON.stringify(datos),
  });
  return handleResponse(res);
}

async function validarIdentidad(id, fechaNacimiento, documentoUrl) {
  const res = await fetch(`${API}/usuarios/${id}/identidad`, {
    method: 'PATCH', headers: authHeaders(),
    body: JSON.stringify({ fechaNacimiento, documentoUrl }),
  });
  return handleResponse(res);
}

// GET /api/usuarios con filtros opcionales
async function listarUsuarios(filtros = {}) {
  const params = new URLSearchParams();
  if (filtros.tipoUsuario) params.set('tipoUsuario', filtros.tipoUsuario);
  if (filtros.genero)      params.set('genero',      filtros.genero);
  if (filtros.categoria)   params.set('categoria',   filtros.categoria);
  if (filtros.ciudad)      params.set('ciudad',       filtros.ciudad);
  const res = await fetch(`${API}/usuarios?${params}`, { headers: authHeaders() });
  return handleResponse(res);
}

// ── OFERTAS ───────────────────────────────────────────────────────────────────
async function crearOferta(datos) {
  const res = await fetch(`${API}/ofertas`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(datos),
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
  const res = await fetch(`${API}/ofertas?${params}`, { headers: authHeaders() });
  return handleResponse(res);
}

async function obtenerOferta(id) {
  const res = await fetch(`${API}/ofertas/${id}`, { headers: authHeaders() });
  return handleResponse(res);
}

async function actualizarOferta(id, datos) {
  const res = await fetch(`${API}/ofertas/${id}`, {
    method: 'PATCH', headers: authHeaders(), body: JSON.stringify(datos),
  });
  return handleResponse(res);
}

async function eliminarOferta(id) {
  const res = await fetch(`${API}/ofertas/${id}`, {
    method: 'DELETE', headers: authHeaders(),
  });
  return handleResponse(res);
}

// ── POSTULACIONES ─────────────────────────────────────────────────────────────
async function postularme(ofertaId, mensaje) {
  const res = await fetch(`${API}/postulaciones`, {
    method: 'POST', headers: authHeaders(),
    body: JSON.stringify({ ofertaId, mensaje }),
  });
  return handleResponse(res);
}

async function obtenerPostulaciones(filtros = {}) {
  const params = new URLSearchParams();
  if (filtros.ofertaId)    params.set('ofertaId',    filtros.ofertaId);
  if (filtros.candidataId) params.set('candidataId', filtros.candidataId);
  const res = await fetch(`${API}/postulaciones?${params}`, { headers: authHeaders() });
  return handleResponse(res);
}

async function cambiarEstadoPostulacion(id, estado) {
  const res = await fetch(`${API}/postulaciones/${id}`, {
    method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ estado }),
  });
  return handleResponse(res);
}

// ── MENSAJES ──────────────────────────────────────────────────────────────────
async function enviarMensaje(receptorId, texto) {
  const res = await fetch(`${API}/mensajes`, {
    method: 'POST', headers: authHeaders(),
    body: JSON.stringify({ receptorId, texto }),
  });
  return handleResponse(res);
}

async function obtenerMensajes(conUserId) {
  const res = await fetch(`${API}/mensajes?con=${conUserId}`, { headers: authHeaders() });
  return handleResponse(res);
}

async function obtenerConversaciones() {
  const res = await fetch(`${API}/mensajes/conversaciones`, { headers: authHeaders() });
  return handleResponse(res);
}

// ── RESEÑAS ───────────────────────────────────────────────────────────────────
async function crearResena(datos) {
  const res = await fetch(`${API}/resenas`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(datos),
  });
  return handleResponse(res);
}

async function obtenerResenas(receptorId) {
  const res = await fetch(`${API}/resenas?receptorId=${receptorId}`, { headers: authHeaders() });
  return handleResponse(res);
}

// ── UI helpers ────────────────────────────────────────────────────────────────
function mostrarError(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.classList.add('visible'); }
}
function ocultarError(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('visible');
}
function setBtnLoading(btn, loading, texto) {
  if (loading) { btn.disabled = true; btn.innerHTML = `<span class="spinner"></span> Cargando...`; }
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