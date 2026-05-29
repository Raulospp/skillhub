#!/usr/bin/env node
// start-frontend.js — Inicia el frontend en puerto fijo y muestra el link correcto

const { execSync, spawn } = require('child_process');
const PORT = 5500;

// Detectar si estamos en Codespaces
const codespaceName = process.env.CODESPACE_NAME;
const domain        = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN || 'app.github.dev';

if (codespaceName) {
  const url = `https://${codespaceName}-${PORT}.${domain}`;
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║           SkillHub — Frontend listo 🚀             ║');
  console.log('╠════════════════════════════════════════════════════╣');
  console.log(`║  Abre este link en tu navegador:                   ║`);
  console.log(`║                                                    ║`);
  console.log(`║  ${url}`);
  console.log(`║                                                    ║`);
  console.log('║  (El puerto se pone público automáticamente)       ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  // Hacer el puerto público automáticamente via gh cli
  try {
    execSync(`gh codespace ports visibility ${PORT}:public -c ${codespaceName} 2>/dev/null`, { stdio: 'ignore' });
  } catch(_) {
    // gh cli puede no estar disponible, no importa
  }
} else {
  console.log(`\n🚀 Frontend corriendo en: http://localhost:${PORT}\n`);
}

// Iniciar serve en puerto fijo
const serve = spawn('npx', ['serve', '.', '-p', String(PORT), '--no-clipboard'], {
  stdio: 'inherit',
  cwd: __dirname
});

serve.on('close', code => process.exit(code));
