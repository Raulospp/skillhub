// server.js — Backend SkillHub
const express  = require('express');
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const cors     = require('cors');

const app = express();
app.use(express.json({ limit: '10mb' })); // necesario para fotos en base64
app.use(cors());

const MONGO_URI = 'mongodb+srv://skillhub_user:skilhub1234@cluster0.mselynh.mongodb.net/skillhub?retryWrites=true&w=majority&appName=Cluster0';
const JWT_SECRET = 'skillhub_secret_2024';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch(err => console.error('❌ Error MongoDB:', err.message));

// ── Schema Usuario ────────────────────────────────────────────────────────────
const usuarioSchema = new mongoose.Schema({
  nombre:          { type: String, required: true },
  email:           { type: String, required: true, unique: true },
  password:        { type: String, required: true },
  rol:             { type: String, default: '' },
  ciudad:          { type: String, default: '' },
  descripcion:     { type: String, default: '' },
  instagram:       { type: String, default: '' },
  telefono:        { type: String, default: '' },
  website:         { type: String, default: '' },
  avatar:          { type: String, default: '' },
  estado:          { type: String, default: 'pendiente' },
  horasAportadas:  { type: Number, default: 0 },
  horasRecibidas:  { type: Number, default: 0 },
  valoracion:      { type: Number, default: 0 },
  serviciosOfrece: [{
    titulo:    String,
    nivel:     String,
    categoria: String,
    ciudad:    String,
  }],
  serviciosBusca: [{
    titulo: String,
    anio:   Number,
  }],
}, { timestamps: true });

const Usuario = mongoose.model('Usuario', usuarioSchema);

// ── Schema Reseña ─────────────────────────────────────────────────────────────
const resenaSchema = new mongoose.Schema({
  autorId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  receptorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  puntuacion: { type: Number, required: true, min: 1, max: 5 },
  comentario: { type: String, required: true },
}, { timestamps: true });

const Resena = mongoose.model('Resena', resenaSchema);

// ── Middleware JWT ────────────────────────────────────────────────────────────
function verificarToken(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(401).json({ message: 'Token requerido' });
  try {
    req.usuario = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido' });
  }
}

// ── AUTH ──────────────────────────────────────────────────────────────────────

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email y contraseña requeridos' });
    const usuario = await Usuario.findOne({ email });
    if (!usuario || !(await bcrypt.compare(password, usuario.password)))
      return res.status(401).json({ message: 'Email o contraseña incorrectos' });
    const token = jwt.sign({ id: usuario._id, email: usuario.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      access_token: token,
      usuario: { id: usuario._id, nombre: usuario.nombre, email: usuario.email, estado: usuario.estado }
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── USUARIOS ──────────────────────────────────────────────────────────────────

// POST /api/usuarios — Registro
app.post('/api/usuarios', async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    if (!nombre || !email || !password)
      return res.status(400).json({ message: 'Nombre, email y contraseña son obligatorios' });
    if (await Usuario.findOne({ email }))
      return res.status(409).json({ message: 'El email ya está registrado' });
    const hash = await bcrypt.hash(password, 10);
    const nuevo = await new Usuario({ nombre, email, password: hash }).save();
    const { password: _, ...datos } = nuevo.toObject();
    res.status(201).json(datos);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/usuarios — Explorar
app.get('/api/usuarios', verificarToken, async (req, res) => {
  try {
    const filtro = {};
    if (req.query.categoria) filtro['serviciosOfrece.categoria'] = req.query.categoria;
    const usuarios = await Usuario.find(filtro).select('-password');
    res.json(usuarios);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/usuarios/:id — Ver perfil
app.get('/api/usuarios/:id', verificarToken, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id).select('-password');
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH /api/usuarios/:id — Editar perfil completo
app.patch('/api/usuarios/:id', verificarToken, async (req, res) => {
  try {
    delete req.body.password;
    delete req.body.email;
    const actualizado = await Usuario.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: false }
    ).select('-password');
    if (!actualizado) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(actualizado);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH /api/usuarios/:id/identidad
app.patch('/api/usuarios/:id/identidad', async (req, res) => {
  try {
    const { fechaNacimiento, documentoUrl } = req.body;
    const actualizado = await Usuario.findByIdAndUpdate(
      req.params.id,
      { fechaNacimiento, documentoIdentidad: documentoUrl, estado: 'pendiente' },
      { new: true }
    ).select('-password');
    res.json(actualizado);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/usuarios/:id
app.delete('/api/usuarios/:id', verificarToken, async (req, res) => {
  try {
    await Usuario.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Cuenta eliminada' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── RESEÑAS ───────────────────────────────────────────────────────────────────

app.post('/api/resenas', verificarToken, async (req, res) => {
  try {
    const resena = await new Resena(req.body).save();
    const todas = await Resena.find({ receptorId: req.body.receptorId });
    const promedio = todas.reduce((s, r) => s + r.puntuacion, 0) / todas.length;
    await Usuario.findByIdAndUpdate(req.body.receptorId, { valoracion: promedio });
    res.status(201).json(resena);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/resenas', verificarToken, async (req, res) => {
  try {
    const filtro = req.query.receptorId ? { receptorId: req.query.receptorId } : {};
    const resenas = await Resena.find(filtro)
      .populate('autorId', 'nombre ciudad')
      .sort({ createdAt: -1 });
    res.json(resenas);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── INICIAR ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 SkillHub API en http://localhost:${PORT}/api`);
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