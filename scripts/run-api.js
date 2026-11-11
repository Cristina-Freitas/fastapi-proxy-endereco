// Sobe o backend (uvicorn) com o Python do .venv, sem precisar ativar o venv.
// Uso: node scripts/run-api.js [argumentos extras para o uvicorn]
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const { ROOT, VENV_PYTHON } = require('./venv');

if (!fs.existsSync(VENV_PYTHON)) {
  console.error(`Python do ambiente virtual não encontrado em: ${VENV_PYTHON}`);
  console.error('Rode "npm run setup" na raiz do projeto e tente novamente.');
  process.exit(1);
}

// Host e porta fixos: o proxy do Vite (frontend/vite.config.js) aponta para 127.0.0.1:8000.
const args = [
  '-m', 'uvicorn', 'app.main:app',
  '--reload',
  '--host', '127.0.0.1',
  '--port', '8000',
  ...process.argv.slice(2),
];

const api = spawn(VENV_PYTHON, args, { cwd: ROOT, stdio: 'inherit' });

api.on('error', (erro) => {
  console.error(`Falha ao iniciar o uvicorn: ${erro.message}`);
  process.exit(1);
});

api.on('exit', (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0));
});

// Encerramento:
// - Ctrl+C no terminal já chega ao uvicorn diretamente (mesmo grupo de processos
//   no Linux/macOS, mesmo console no Windows).
// - Quando o concurrently encerra este script (ex.: o frontend caiu), no Linux/macOS
//   repassamos o sinal ao uvicorn; no Windows o concurrently já mata a árvore inteira.
// Em todos os casos este processo só termina depois que o uvicorn terminar.
for (const sinal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(sinal, () => {
    if (process.platform !== 'win32' && api.exitCode === null) {
      api.kill('SIGTERM');
    }
  });
}
