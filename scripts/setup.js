// Prepara o projeto em uma máquina nova (Windows, Linux ou macOS):
//   1. cria o .venv, se ainda não existir;
//   2. instala as dependências Python (requirements.txt) no .venv;
//   3. instala as dependências Node da raiz e do frontend.
// Uso: npm run setup
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { ROOT, VENV_DIR, VENV_PYTHON } = require('./venv');

const PYTHON_MINIMO = [3, 10];
const IS_WINDOWS = process.platform === 'win32';

function etapa(mensagem) {
  console.log(`\n> ${mensagem}`);
}

function falhar(...linhas) {
  console.error(`\nErro: ${linhas.join('\n')}`);
  process.exit(1);
}

/** Executa um comando mostrando a saída; encerra o setup se ele falhar. */
function executar(comando, args, opcoes = {}) {
  const resultado = spawnSync(comando, args, { cwd: ROOT, stdio: 'inherit', ...opcoes });
  if (resultado.error || resultado.status !== 0) {
    falhar(`o comando "${[comando, ...args].join(' ')}" falhou.`);
  }
}

/** Executa o npm do próprio processo atual (evita depender de npm.cmd no PATH do Windows). */
function npm(args, cwd) {
  const npmCli = process.env.npm_execpath;
  if (npmCli && npmCli.endsWith('.js')) {
    executar(process.execPath, [npmCli, ...args], { cwd });
  } else {
    executar('npm', args, { cwd, shell: IS_WINDOWS });
  }
}

/**
 * Procura um Python >= 3.10 instalado no sistema.
 * Linux/macOS costumam ter "python3"; no Windows, "py -3" (launcher) ou "python".
 */
function encontrarPython() {
  const candidatos = IS_WINDOWS
    ? [['py', '-3'], ['python'], ['python3']]
    : [['python3'], ['python']];

  const verificacao =
    `import sys; print('%d.%d' % sys.version_info[:2]); ` +
    `sys.exit(0 if sys.version_info >= (${PYTHON_MINIMO.join(', ')}) else 3)`;

  const encontradosAntigos = [];
  for (const [comando, ...args] of candidatos) {
    const resultado = spawnSync(comando, [...args, '-c', verificacao], { encoding: 'utf8' });
    if (resultado.error) continue; // comando inexistente
    const versao = (resultado.stdout || '').trim();
    if (resultado.status === 0) return { comando, args, versao };
    if (resultado.status === 3) encontradosAntigos.push(`${comando} (${versao})`);
    // Outros códigos (ex.: atalho "python" da Microsoft Store sem Python instalado): ignora.
  }

  falhar(
    `é necessário Python ${PYTHON_MINIMO.join('.')} ou superior.`,
    encontradosAntigos.length
      ? `Versões encontradas, mas antigas: ${encontradosAntigos.join(', ')}.`
      : 'Nenhum Python foi encontrado no PATH.',
    'Instale em https://www.python.org/downloads/ e rode "npm run setup" novamente.',
  );
}

function criarVenv() {
  if (fs.existsSync(VENV_PYTHON)) {
    etapa(`Ambiente virtual já existe em ${path.relative(ROOT, VENV_DIR)}/ (mantido)`);
    return;
  }
  if (fs.existsSync(VENV_DIR)) {
    falhar(
      `a pasta ${path.relative(ROOT, VENV_DIR)}/ existe, mas não contém ${path.relative(ROOT, VENV_PYTHON)}.`,
      'Ela pode estar incompleta ou ter sido criada em outro sistema operacional.',
      'Apague a pasta .venv e rode "npm run setup" novamente.',
    );
  }

  const python = encontrarPython();
  etapa(`Criando ambiente virtual com ${[python.comando, ...python.args].join(' ')} (Python ${python.versao})`);
  const resultado = spawnSync(python.comando, [...python.args, '-m', 'venv', VENV_DIR], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  if (resultado.status !== 0 || !fs.existsSync(VENV_PYTHON)) {
    fs.rmSync(VENV_DIR, { recursive: true, force: true }); // não deixa um venv pela metade
    falhar(
      'não foi possível criar o ambiente virtual.',
      'No Debian/Ubuntu, instale o módulo venv: sudo apt install python3-venv',
    );
  }
}

etapa('Verificando o ambiente virtual Python');
criarVenv();

etapa('Instalando dependências Python (requirements.txt)');
executar(VENV_PYTHON, ['-m', 'pip', 'install', '-r', 'requirements.txt']);

etapa('Instalando dependências Node da raiz');
npm(['install'], ROOT);

etapa('Instalando dependências do frontend');
npm(['install'], path.join(ROOT, 'frontend'));

console.log('\nTudo pronto! Para subir backend e frontend juntos, rode: npm run dev');
