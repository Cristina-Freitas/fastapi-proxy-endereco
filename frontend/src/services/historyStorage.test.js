import { beforeEach, describe, expect, it } from 'vitest'
import {
  LIMITE_HISTORICO,
  adicionarAoHistorico,
  carregarHistorico,
  limparHistoricoSalvo,
  salvarHistorico,
} from './historyStorage'

function criarStorage(inicial = {}) {
  const dados = { ...inicial }
  return {
    getItem: (chave) => (chave in dados ? dados[chave] : null),
    setItem: (chave, valor) => {
      dados[chave] = String(valor)
    },
    removeItem: (chave) => {
      delete dados[chave]
    },
    dados,
  }
}

const entrada = (cep, extra = {}) => ({
  cep,
  logradouro: 'Rua A',
  bairro: 'Centro',
  cidade: 'Florianópolis',
  estado: 'SC',
  regiao: 'Sul',
  consultadoEm: '2026-10-09T18:49:00.000Z',
  ...extra,
})

describe('adicionarAoHistorico', () => {
  it('coloca a consulta mais recente no topo', () => {
    const resultado = adicionarAoHistorico([entrada('11111111')], entrada('22222222'))
    expect(resultado.map((i) => i.cep)).toEqual(['22222222', '11111111'])
  })

  it('não duplica o CEP: move a consulta repetida para o topo', () => {
    const lista = [entrada('11111111'), entrada('22222222')]
    const resultado = adicionarAoHistorico(lista, entrada('22222222'))
    expect(resultado.map((i) => i.cep)).toEqual(['22222222', '11111111'])
  })

  it('respeita o limite de itens', () => {
    let lista = []
    for (let i = 0; i < LIMITE_HISTORICO + 5; i += 1) {
      lista = adicionarAoHistorico(lista, entrada(String(i).padStart(8, '0')))
    }
    expect(lista).toHaveLength(LIMITE_HISTORICO)
    expect(lista[0].cep).toBe(String(LIMITE_HISTORICO + 4).padStart(8, '0'))
  })

  it('não altera a lista original', () => {
    const lista = [entrada('11111111')]
    adicionarAoHistorico(lista, entrada('22222222'))
    expect(lista).toHaveLength(1)
  })
})

describe('persistência', () => {
  let storage
  beforeEach(() => {
    storage = criarStorage()
  })

  it('salva e recarrega o histórico', () => {
    const lista = [entrada('01452002'), entrada('88010000')]
    salvarHistorico(lista, storage)
    expect(carregarHistorico(storage)).toEqual(lista)
  })

  it('retorna lista vazia quando não há dados', () => {
    expect(carregarHistorico(storage)).toEqual([])
  })

  it('ignora JSON corrompido', () => {
    storage.setItem('fastapi-proxy-endereco:historico', '{quebrado')
    expect(carregarHistorico(storage)).toEqual([])
  })

  it('descarta entradas com formato inválido', () => {
    salvarHistorico([entrada('01452002'), { cep: 'abc' }, null, { foo: 1 }], storage)
    expect(carregarHistorico(storage).map((i) => i.cep)).toEqual(['01452002'])
  })

  it('limpa o histórico salvo', () => {
    salvarHistorico([entrada('01452002')], storage)
    limparHistoricoSalvo(storage)
    expect(carregarHistorico(storage)).toEqual([])
  })

  it('funciona sem storage disponível', () => {
    expect(carregarHistorico(null)).toEqual([])
    expect(() => salvarHistorico([entrada('01452002')], null)).not.toThrow()
    expect(() => limparHistoricoSalvo(null)).not.toThrow()
  })
})
