// server.js — Backend SkillHub
// Ejecutar: node server.js

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// ── Conexión a MongoDB Atlas ──────────────────────────────────────────────────
const MONGO_URI = 'mongodb+srv://skillhub_user:skilhub1234@cluster0.mongodb.net/skillhub?retryWrites=true&w=majority';
const JWT_SECRET = 'skillhub_secret_2024';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch(err => console.error('❌ Error MongoDB:', err.message));

// ── Schema y Modelo de Usuario ────────────────────────────────────────────────
const usuarioSchema = new mongoose.Schema({
  nombre:          { type: String, required: true },
  email:           { type: String, required: true, unique: true },
  password:        { type: String, required: true },
  rol:             { type: String, default: '' },
  ciudad:          { type: String, default: '' },
  descripcion:     { type: String, default: '' },
  estado:          { type: String, default: 'pendiente' },
  horasAportadas:  { type: Number, default: 0 },
  horasRecibidas:  { type: Number, default: 0 },
  valoracion:      { type: Number, default: 0 },
  serviciosOfrece: { type: Array,  default: [] },
  serviciosBusca:  { type: Array,  default: [] },
}, { timestamps: true });

const Usuario = mongoose.model('Usuario', usuarioSchema);

// ── Schema y Modelo de Reseña ─────────────────────────────────────────────────
const resenaSchema = new mongoose.Schema({
  autorId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  receptorId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  puntuacion:  { type: Number, required: true, min: 1, max: 5 },
  comentario:  { type: String, required: true },
}, { timestamps: true });

const Resena = mongoose.model('Resena', resenaSchema);

// ── Middleware: verificar JWT ──────────────────────────────────────────────────
function verificarToken(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(401).json({ message: 'Token requerido' });
  const token = auth.split(' ')[1];
  try {
    req.usuario = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido' });
  }
}

// ════════════════════════════════════════════════════════════════════════════════
//  RUTAS — AUTH
// ════════════════════════════════════════════════════════════════════════════════

// POST /api/auth/login — Iniciar sesión
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email y contraseña requeridos' });

    const usuario = await Usuario.findOne({ email });
    if (!usuario)
      return res.status(401).json({ message: 'Email o contraseña incorrectos' });

    const ok = await bcrypt.compare(password, usuario.password);
    if (!ok)
      return res.status(401).json({ message: 'Email o contraseña incorrectos' });

    const token = jwt.sign(
      { id: usuario._id, email: usuario.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      access_token: token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        estado: usuario.estado,
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
//  RUTAS — USUARIOS
// ════════════════════════════════════════════════════════════════════════════════

// POST /api/usuarios — Registrar nuevo usuario (pantalla Registro)
app.post('/api/usuarios', async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    if (!nombre || !email || !password)
      return res.status(400).json({ message: 'Nombre, email y contraseña son obligatorios' });

    const existe = await Usuario.findOne({ email });
    if (existe)
      return res.status(409).json({ message: 'El email ya está registrado' });

    const hash = await bcrypt.hash(password, 10);
    const nuevo = new Usuario({ nombre, email, password: hash });
    const guardado = await nuevo.save();

    // No devolver la contraseña
    const { password: _, ...datos } = guardado.toObject();
    res.status(201).json(datos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/usuarios — Listar todos (pantalla Explorar)
// GET /api/usuarios?categoria=Tecnología — Filtrar por categoría
app.get('/api/usuarios', verificarToken, async (req, res) => {
  try {
    const filtro = { estado: 'activo' };
    if (req.query.categoria) {
      filtro['serviciosOfrece.categoria'] = req.query.categoria;
    }
    const usuarios = await Usuario.find(filtro).select('-password');
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/usuarios/:id — Ver perfil (pantallas Perfil propio y público)
app.get('/api/usuarios/:id', verificarToken, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id).select('-password');
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/usuarios/:id — Editar perfil (pantalla Perfil propio)
app.patch('/api/usuarios/:id', verificarToken, async (req, res) => {
  try {
    const campos = req.body;
    delete campos.password; // no se puede cambiar la contraseña por aquí
    const actualizado = await Usuario.findByIdAndUpdate(
      req.params.id, campos, { new: true }
    ).select('-password');
    if (!actualizado) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(actualizado);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/usuarios/:id/identidad — Validación de identidad (pantalla 3)
app.patch('/api/usuarios/:id/identidad', async (req, res) => {
  try {
    const { fechaNacimiento, documentoUrl } = req.body;
    const actualizado = await Usuario.findByIdAndUpdate(
      req.params.id,
      { fechaNacimiento, documentoIdentidad: documentoUrl, estado: 'pendiente' },
      { new: true }
    ).select('-password');
    res.json(actualizado);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/usuarios/:id — Eliminar cuenta
app.delete('/api/usuarios/:id', verificarToken, async (req, res) => {
  try {
    await Usuario.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Cuenta eliminada' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
//  RUTAS — RESEÑAS
// ════════════════════════════════════════════════════════════════════════════════

// POST /api/resenas — Crear reseña (botón Calificar)
app.post('/api/resenas', verificarToken, async (req, res) => {
  try {
    const resena = new Resena(req.body);
    const guardada = await resena.save();

    // Actualizar valoración promedio del receptor
    const todasLasResenas = await Resena.find({ receptorId: req.body.receptorId });
    const promedio = todasLasResenas.reduce((s, r) => s + r.puntuacion, 0) / todasLasResenas.length;
    await Usuario.findByIdAndUpdate(req.body.receptorId, { valoracion: promedio });

    res.status(201).json(guardada);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/resenas?receptorId=xxx — Ver reseñas de un usuario
app.get('/api/resenas', verificarToken, async (req, res) => {
  try {
    const filtro = req.query.receptorId ? { receptorId: req.query.receptorId } : {};
    const resenas = await Resena.find(filtro)
      .populate('autorId', 'nombre ciudad')
      .sort({ createdAt: -1 });
    res.json(resenas);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
//  INICIAR SERVIDOR
// ════════════════════════════════════════════════════════════════════════════════
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 SkillHub API corriendo en http://localhost:${PORT}/api`);
  console.log(`   Rutas disponibles:`);
  console.log(`   POST   /api/auth/login`);
  console.log(`   POST   /api/usuarios`);
  console.log(`   GET    /api/usuarios`);
  console.log(`   GET    /api/usuarios/:id`);
  console.log(`   PATCH  /api/usuarios/:id`);
  console.log(`   PATCH  /api/usuarios/:id/identidad`);
  console.log(`   DELETE /api/usuarios/:id`);
  console.log(`   POST   /api/resenas`);
  console.log(`   GET    /api/resenas?receptorId=`);
});
