// js/api.js — Servicio central de llamadas al backend NestJS
// Todas las pantallas importan desde aquí

const API = 'http://localhost:3000/api';

// ── Helpers ─────────────────────────────────────────────────────────────────

function getToken() {
  return localStorage.getItem('access_token');
}

function getUsuario() {
  const u = localStorage.getItem('usuario');
  return u ? JSON.parse(u) : null;
}

function guardarSesion(data) {
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('usuario', JSON.stringify(data.usuario));
}

function cerrarSesion() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('usuario');
  window.location.href = 'index.html';
}

function estaLogueado() {
  return !!getToken();
}

// Headers con JWT para rutas protegidas
function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
  };
}

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error del servidor');
  return data;
}

// ── AUTH ─────────────────────────────────────────────────────────────────────

async function login(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await handleResponse(res);
  guardarSesion(data);
  return data;
}

async function registro(nombre, email, password) {
  const res = await fetch(`${API}/usuarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, email, password }),
  });
  return handleResponse(res);
}

// ── USUARIOS ─────────────────────────────────────────────────────────────────

async function obtenerPerfil(id) {
  const res = await fetch(`${API}/usuarios/${id}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

async function actualizarPerfil(id, datos) {
  const res = await fetch(`${API}/usuarios/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(datos),
  });
  return handleResponse(res);
}

async function validarIdentidad(id, fechaNacimiento, documentoUrl) {
  const res = await fetch(`${API}/usuarios/${id}/identidad`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ fechaNacimiento, documentoUrl }),
  });
  return handleResponse(res);
}

// ── SERVICIOS (explorar) ──────────────────────────────────────────────────────

async function listarUsuarios(categoria) {
  const params = categoria ? `?categoria=${encodeURIComponent(categoria)}` : '';
  const res = await fetch(`${API}/usuarios${params}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

async function listarServicios(categoria, usuarioId) {
  const params = new URLSearchParams();
  if (categoria) params.set('categoria', categoria);
  if (usuarioId) params.set('usuarioId', usuarioId);
  const res = await fetch(`${API}/servicios?${params}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

async function publicarServicio(datos) {
  const res = await fetch(`${API}/servicios`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(datos),
  });
  return handleResponse(res);
}

async function cambiarEstadoServicio(id, estado) {
  const res = await fetch(`${API}/servicios/${id}/estado`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ estado }),
  });
  return handleResponse(res);
}

// ── RESEÑAS ───────────────────────────────────────────────────────────────────

async function obtenerResenas(receptorId) {
  const res = await fetch(`${API}/resenas?receptorId=${receptorId}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

async function crearResena(datos) {
  const res = await fetch(`${API}/resenas`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(datos),
  });
  return handleResponse(res);
}

// ── Utilidades de UI ──────────────────────────────────────────────────────────

function mostrarError(elementId, mensaje) {
  const el = document.getElementById(elementId);
  if (el) { el.textContent = mensaje; el.classList.add('visible'); }
}

function ocultarError(elementId) {
  const el = document.getElementById(elementId);
  if (el) el.classList.remove('visible');
}

function setBtnLoading(btn, loading, textoOriginal) {
  if (loading) {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> Cargando...`;
  } else {
    btn.disabled = false;
    btn.textContent = textoOriginal;
  }
}

// Redirigir si no está logueado (usar en páginas protegidas)
function requireAuth() {
  if (!estaLogueado()) {
    window.location.href = 'login.html';
  }
}

// Iniciales a partir del nombre
function iniciales(nombre) {
  return nombre ? nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??';
}
