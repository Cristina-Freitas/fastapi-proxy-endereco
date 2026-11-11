const CHAVE = 'fastapi-proxy-endereco:historico'
export const LIMITE_HISTORICO = 20

function obterStorage() {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null // ex.: armazenamento bloqueado pelo navegador
  }
}

function entradaValida(item) {
  return (
    item &&
    typeof item.cep === 'string' &&
    /^\d{8}$/.test(item.cep) &&
    typeof item.consultadoEm === 'string'
  )
}

/** Adiciona uma consulta ao topo, sem duplicar o CEP e respeitando o limite. */
export function adicionarAoHistorico(historico, entrada) {
  return [entrada, ...historico.filter((item) => item.cep !== entrada.cep)].slice(
    0,
    LIMITE_HISTORICO,
  )
}

export function carregarHistorico(storage = obterStorage()) {
  if (!storage) return []
  try {
    const lista = JSON.parse(storage.getItem(CHAVE) ?? '[]')
    return Array.isArray(lista) ? lista.filter(entradaValida) : []
  } catch {
    return []
  }
}

export function salvarHistorico(historico, storage = obterStorage()) {
  if (!storage) return
  try {
    storage.setItem(CHAVE, JSON.stringify(historico))
  } catch {
    // Armazenamento cheio ou indisponível: o histórico segue só em memória.
  }
}

export function limparHistoricoSalvo(storage = obterStorage()) {
  if (!storage) return
  try {
    storage.removeItem(CHAVE)
  } catch {
    // ignorado
  }
}
