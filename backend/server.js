// server.js — SkillHub Backend completo
const express  = require('express');
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const cors     = require('cors');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());

const MONGO_URI = "mongodb+srv://skillhub_user:skillhub1234@cluster0.mselynh.mongodb.net/skillhub?retryWrites=true&w=majority";
const JWT_SECRET = 'skillhub_secret_2024';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch(err => console.error('❌ Error MongoDB:', err.message));

// ── Schemas ───────────────────────────────────────────────────────────────────

const usuarioSchema = new mongoose.Schema({
  nombre:          { type: String, required: true },
  email:           { type: String, required: true, unique: true },
  password:        { type: String, required: true },
  tipoUsuario:     { type: String, enum: ['candidata', 'empresa'], required: true },
  genero:          { type: String, default: '' },
  rol:             { type: String, default: '' },
  ciudad:          { type: String, default: '' },
  descripcion:     { type: String, default: '' },
  avatar:          { type: String, default: '' },
  instagram:       { type: String, default: '' },
  telefono:        { type: String, default: '' },
  website:         { type: String, default: '' },
  nombreEmpresa:   { type: String, default: '' },
  sectorEmpresa:   { type: String, default: '' },
  serviciosOfrece: [{ titulo: String, nivel: String, categoria: String, ciudad: String }],
  serviciosBusca:  [{ titulo: String, anio: Number }],
  horasAportadas:  { type: Number, default: 0 },
  horasRecibidas:  { type: Number, default: 0 },
  valoracion:      { type: Number, default: 0 },
  estado:          { type: String, default: 'activo' },
}, { timestamps: true });

const Usuario = mongoose.model('Usuario', usuarioSchema);

const ofertaSchema = new mongoose.Schema({
  empresaId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  titulo:      { type: String, required: true },
  descripcion: { type: String, required: true },
  categoria:   { type: String, default: '' },
  ciudad:      { type: String, default: '' },
  modalidad:   { type: String, default: 'Presencial' },
  salario:     { type: String, default: '' },
  requisitos:  { type: String, default: '' },
  dirigidoA:   { type: String, default: 'todas' },
  estado:      { type: String, default: 'activa' },
  fechaLimite: { type: Date },
}, { timestamps: true });

const Oferta = mongoose.model('Oferta', ofertaSchema);

const postulacionSchema = new mongoose.Schema({
  candidataId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  ofertaId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Oferta',  required: true },
  mensaje:     { type: String, default: '' },
  estado:      { type: String, default: 'pendiente' },
}, { timestamps: true });

const Postulacion = mongoose.model('Postulacion', postulacionSchema);

const mensajeSchema = new mongoose.Schema({
  emisorId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  receptorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  texto:      { type: String, required: true },
  leido:      { type: Boolean, default: false },
}, { timestamps: true });

const Mensaje = mongoose.model('Mensaje', mensajeSchema);

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
  } catch { res.status(401).json({ message: 'Token inválido' }); }
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Campos requeridos' });
    const usuario = await Usuario.findOne({ email });
    if (!usuario || !(await bcrypt.compare(password, usuario.password)))
      return res.status(401).json({ message: 'Email o contraseña incorrectos' });
    const token = jwt.sign(
      { id: usuario._id, email: usuario.email, tipoUsuario: usuario.tipoUsuario },
      JWT_SECRET, { expiresIn: '7d' }
    );
    res.json({
      access_token: token,
      usuario: { id: usuario._id, nombre: usuario.nombre, email: usuario.email,
        tipoUsuario: usuario.tipoUsuario, avatar: usuario.avatar, estado: usuario.estado }
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── USUARIOS ──────────────────────────────────────────────────────────────────
app.post('/api/usuarios', async (req, res) => {
  try {
    const { nombre, email, password, tipoUsuario, genero } = req.body;
    if (!nombre || !email || !password || !tipoUsuario)
      return res.status(400).json({ message: 'Nombre, email, contraseña y tipo son obligatorios' });
    if (!['candidata', 'empresa'].includes(tipoUsuario))
      return res.status(400).json({ message: 'Tipo inválido: candidata o empresa' });
    if (await Usuario.findOne({ email }))
      return res.status(409).json({ message: 'El email ya está registrado' });
    const hash = await bcrypt.hash(password, 10);
    const nuevo = await new Usuario({ nombre, email, password: hash, tipoUsuario, genero }).save();
    const { password: _, ...datos } = nuevo.toObject();
    res.status(201).json(datos);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/usuarios', verificarToken, async (req, res) => {
  try {
    const filtro = {};
    if (req.query.tipoUsuario) filtro.tipoUsuario = req.query.tipoUsuario;
    if (req.query.genero)      filtro.genero      = req.query.genero;
    if (req.query.categoria)   filtro['serviciosOfrece.categoria'] = req.query.categoria;
    if (req.query.ciudad)      filtro.ciudad = new RegExp(req.query.ciudad, 'i');
    const usuarios = await Usuario.find(filtro).select('-password').sort({ createdAt: -1 });
    res.json(usuarios);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/usuarios/:id', verificarToken, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id).select('-password');
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.patch('/api/usuarios/:id', verificarToken, async (req, res) => {
  try {
    delete req.body.password; delete req.body.email;
    const u = await Usuario.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    if (!u) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(u);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.patch('/api/usuarios/:id/identidad', async (req, res) => {
  try {
    const { fechaNacimiento, documentoUrl } = req.body;
    const u = await Usuario.findByIdAndUpdate(req.params.id,
      { fechaNacimiento, documentoIdentidad: documentoUrl }, { new: true }).select('-password');
    res.json(u);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.delete('/api/usuarios/:id', verificarToken, async (req, res) => {
  try {
    await Usuario.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Cuenta eliminada' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── OFERTAS ───────────────────────────────────────────────────────────────────
app.post('/api/ofertas', verificarToken, async (req, res) => {
  try {
    const oferta = await new Oferta({ ...req.body, empresaId: req.usuario.id }).save();
    res.status(201).json(oferta);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/ofertas', verificarToken, async (req, res) => {
  try {
    const filtro = { estado: 'activa' };
    if (req.query.ciudad)    filtro.ciudad    = new RegExp(req.query.ciudad, 'i');
    if (req.query.categoria) filtro.categoria = req.query.categoria;
    if (req.query.modalidad) filtro.modalidad = req.query.modalidad;
    if (req.query.dirigidoA && req.query.dirigidoA !== 'todas')
      filtro.dirigidoA = { $in: [req.query.dirigidoA, 'todas'] };
    if (req.query.empresaId) filtro.empresaId = req.query.empresaId;
    const ofertas = await Oferta.find(filtro)
      .populate('empresaId', 'nombre avatar ciudad nombreEmpresa sectorEmpresa')
      .sort({ createdAt: -1 });
    res.json(ofertas);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/ofertas/:id', verificarToken, async (req, res) => {
  try {
    const oferta = await Oferta.findById(req.params.id)
      .populate('empresaId', 'nombre avatar ciudad nombreEmpresa sectorEmpresa telefono instagram website');
    if (!oferta) return res.status(404).json({ message: 'Oferta no encontrada' });
    res.json(oferta);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.patch('/api/ofertas/:id', verificarToken, async (req, res) => {
  try {
    const o = await Oferta.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!o) return res.status(404).json({ message: 'Oferta no encontrada' });
    res.json(o);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.delete('/api/ofertas/:id', verificarToken, async (req, res) => {
  try {
    await Oferta.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Oferta eliminada' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── POSTULACIONES ─────────────────────────────────────────────────────────────
app.post('/api/postulaciones', verificarToken, async (req, res) => {
  try {
    const existe = await Postulacion.findOne({ candidataId: req.usuario.id, ofertaId: req.body.ofertaId });
    if (existe) return res.status(409).json({ message: 'Ya te postulaste a esta oferta' });
    const post = await new Postulacion({ ...req.body, candidataId: req.usuario.id }).save();
    res.status(201).json(post);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/postulaciones', verificarToken, async (req, res) => {
  try {
    const filtro = {};
    if (req.query.ofertaId)    filtro.ofertaId    = req.query.ofertaId;
    if (req.query.candidataId) filtro.candidataId = req.query.candidataId;
    const posts = await Postulacion.find(filtro)
      .populate('candidataId', 'nombre avatar rol ciudad descripcion serviciosOfrece genero valoracion telefono instagram')
      .populate('ofertaId', 'titulo ciudad modalidad estado')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.patch('/api/postulaciones/:id', verificarToken, async (req, res) => {
  try {
    const p = await Postulacion.findByIdAndUpdate(req.params.id, { estado: req.body.estado }, { new: true });
    if (!p) return res.status(404).json({ message: 'Postulación no encontrada' });
    res.json(p);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── MENSAJES ──────────────────────────────────────────────────────────────────
app.post('/api/mensajes', verificarToken, async (req, res) => {
  try {
    const msg = await new Mensaje({
      emisorId: req.usuario.id, receptorId: req.body.receptorId, texto: req.body.texto
    }).save();
    const populated = await Mensaje.findById(msg._id)
      .populate('emisorId', 'nombre avatar')
      .populate('receptorId', 'nombre avatar');
    res.status(201).json(populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/mensajes', verificarToken, async (req, res) => {
  try {
    const yo = req.usuario.id, con = req.query.con;
    const mensajes = await Mensaje.find({
      $or: [{ emisorId: yo, receptorId: con }, { emisorId: con, receptorId: yo }]
    })
    .populate('emisorId', 'nombre avatar')
    .populate('receptorId', 'nombre avatar')
    .sort({ createdAt: 1 });
    await Mensaje.updateMany({ emisorId: con, receptorId: yo, leido: false }, { leido: true });
    res.json(mensajes);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/mensajes/conversaciones', verificarToken, async (req, res) => {
  try {
    const yo = req.usuario.id;
    const msgs = await Mensaje.find({ $or: [{ emisorId: yo }, { receptorId: yo }] })
      .populate('emisorId', 'nombre avatar tipoUsuario')
      .populate('receptorId', 'nombre avatar tipoUsuario')
      .sort({ createdAt: -1 });
    const map = {};
    msgs.forEach(m => {
      const otroId = m.emisorId._id.toString() === yo
        ? m.receptorId._id.toString() : m.emisorId._id.toString();
      if (!map[otroId]) {
        map[otroId] = {
          usuario: m.emisorId._id.toString() === yo ? m.receptorId : m.emisorId,
          ultimoMensaje: m.texto, fecha: m.createdAt, noLeidos: 0
        };
      }
      if (!m.leido && m.receptorId._id.toString() === yo) map[otroId].noLeidos++;
    });
    res.json(Object.values(map));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── RESEÑAS ───────────────────────────────────────────────────────────────────
app.post('/api/resenas', verificarToken, async (req, res) => {
  try {
    const resena = await new Resena({ ...req.body, autorId: req.usuario.id }).save();
    const todas = await Resena.find({ receptorId: req.body.receptorId });
    const prom  = todas.reduce((s, r) => s + r.puntuacion, 0) / todas.length;
    await Usuario.findByIdAndUpdate(req.body.receptorId, { valoracion: prom });
    res.status(201).json(resena);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/resenas', verificarToken, async (req, res) => {
  try {
    const filtro = req.query.receptorId ? { receptorId: req.query.receptorId } : {};
    const resenas = await Resena.find(filtro)
      .populate('autorId', 'nombre avatar tipoUsuario')
      .sort({ createdAt: -1 });
    res.json(resenas);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── INICIAR ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 SkillHub API en http://localhost:${PORT}/api`);
  console.log('\n  POST /api/auth/login');
  console.log('  POST/GET/PATCH /api/usuarios');
  console.log('  POST/GET/PATCH/DELETE /api/ofertas');
  console.log('  POST/GET/PATCH /api/postulaciones');
  console.log('  POST/GET /api/mensajes  GET /api/mensajes/conversaciones');
  console.log('  POST/GET /api/resenas\n');
});