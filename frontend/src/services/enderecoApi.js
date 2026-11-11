/** Mensagens exibidas ao usuário final, por tipo de erro. */
export const MENSAGENS = {
  cep_invalido: 'O CEP deve conter oito números.',
  nao_encontrado: 'CEP não encontrado. Confira os números e tente novamente.',
  indisponivel:
    'O serviço de consulta está temporariamente indisponível. Tente novamente em instantes.',
  conexao:
    'Não foi possível conectar ao backend. Verifique se a API está em execução.',
  inesperado: 'Ocorreu um erro inesperado. Tente novamente.',
  sem_localizacao: 'Não foi possível localizar este endereço no mapa.',
  mapa_indisponivel:
    'O serviço de mapas está temporariamente indisponível. A consulta do CEP não foi afetada.',
}

export class ApiError extends Error {
  constructor(tipo, mensagem = MENSAGENS[tipo]) {
    super(mensagem)
    this.name = 'ApiError'
    this.tipo = tipo
  }
}

async function lerJson(resposta) {
  try {
    return await resposta.json()
  } catch {
    return null
  }
}

/** Executa o fetch; falhas de rede viram `falhaDeRede`, cancelamentos são repassados. */
async function requisitar(url, { signal, falhaDeRede }) {
  try {
    return await fetch(url, { signal, headers: { Accept: 'application/json' } })
  } catch (erro) {
    if (erro?.name === 'AbortError') throw erro
    throw new ApiError(falhaDeRede)
  }
}

function erroDoEndereco(status, corpo) {
  if (status === 400) return new ApiError('cep_invalido')
  if (status === 404) return new ApiError('nao_encontrado')
  if (status === 502) return new ApiError('indisponivel')
  // O FastAPI sempre responde com { detail }. Sem corpo JSON, a resposta veio
  // do proxy porque o backend não está acessível.
  return new ApiError(corpo?.detail ? 'inesperado' : 'conexao')
}

/** GET /endereco/{cep} — devolve exatamente os campos fornecidos pela API. */
export async function buscarEndereco(cep, { signal } = {}) {
  const resposta = await requisitar(`/endereco/${cep}`, {
    signal,
    falhaDeRede: 'conexao',
  })
  const corpo = await lerJson(resposta)

  if (!resposta.ok) throw erroDoEndereco(resposta.status, corpo)
  if (!corpo || typeof corpo.logradouro !== 'string') {
    throw new ApiError('conexao')
  }

  const { logradouro, bairro, cidade, estado, regiao } = corpo
  return {
    logradouro: logradouro ?? '',
    bairro: bairro ?? '',
    cidade: cidade ?? '',
    estado: estado ?? '',
    regiao: regiao ?? '',
  }
}

/** GET /endereco/{cep}/localizacao — coordenadas para o mapa. */
export async function buscarLocalizacao(cep, { signal } = {}) {
  const resposta = await requisitar(`/endereco/${cep}/localizacao`, {
    signal,
    falhaDeRede: 'mapa_indisponivel',
  })
  const corpo = await lerJson(resposta)

  if (resposta.status === 404) throw new ApiError('sem_localizacao')
  if (!resposta.ok) throw new ApiError('mapa_indisponivel')

  const { latitude, longitude, precisao, aproximada } = corpo ?? {}
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new ApiError('mapa_indisponivel')
  }
  return { latitude, longitude, precisao, aproximada: Boolean(aproximada) }
}

/** GET / (via /api-status) — informa se o backend está respondendo. */
export async function verificarApi({ timeoutMs = 5000 } = {}) {
  const controlador = new AbortController()
  const temporizador = setTimeout(() => controlador.abort(), timeoutMs)
  try {
    const resposta = await fetch('/api-status', {
      signal: controlador.signal,
      headers: { Accept: 'application/json' },
    })
    if (!resposta.ok) return false
    const corpo = await lerJson(resposta)
    return typeof corpo?.mensagem === 'string'
  } catch {
    return false
  } finally {
    clearTimeout(temporizador)
  }
}
