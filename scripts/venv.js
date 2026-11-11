// Caminhos do ambiente virtual Python, compartilhados por setup.js e run-api.js.
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const VENV_DIR = path.join(ROOT, '.venv');

// O venv cria o executável em lugares diferentes conforme o sistema:
// Windows: .venv\Scripts\python.exe | Linux/macOS: .venv/bin/python
const VENV_PYTHON =
  process.platform === 'win32'
    ? path.join(VENV_DIR, 'Scripts', 'python.exe')
    : path.join(VENV_DIR, 'bin', 'python');

module.exports = { ROOT, VENV_DIR, VENV_PYTHON };
