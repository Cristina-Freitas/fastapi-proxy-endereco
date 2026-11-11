import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, MENSAGENS, buscarEndereco, buscarLocalizacao } from './enderecoApi'

function responder(status, corpo) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () =>
      corpo === undefined ? Promise.reject(new Error('sem corpo')) : Promise.resolve(corpo),
  })
}

function simularFetch(resposta) {
  const fetchFalso = vi.fn(() => resposta)
  vi.stubGlobal('fetch', fetchFalso)
  return fetchFalso
}

afterEach(() => vi.unstubAllGlobals())

describe('buscarEndereco', () => {
  it('chama GET /endereco/{cep} e devolve os campos da API', async () => {
    const fetchFalso = simularFetch(
      responder(200, {
        logradouro: 'Avenida Brigadeiro Faria Lima',
        bairro: 'Itaim Bibi',
        cidade: 'São Paulo',
        estado: 'SP',
        regiao: 'Sudeste',
      }),
    )

    const dados = await buscarEndereco('01452002')

    expect(fetchFalso.mock.calls[0][0]).toBe('/endereco/01452002')
    expect(dados).toEqual({
      logradouro: 'Avenida Brigadeiro Faria Lima',
      bairro: 'Itaim Bibi',
      cidade: 'São Paulo',
      estado: 'SP',
      regiao: 'Sudeste',
    })
  })

  it.each([
    [400, { detail: 'x' }, 'cep_invalido'],
    [404, { detail: 'x' }, 'nao_encontrado'],
    [502, { detail: 'x' }, 'indisponivel'],
    [500, { detail: 'x' }, 'inesperado'],
    [500, undefined, 'conexao'], // erro do proxy com o backend desligado
  ])('traduz HTTP %i para o tipo %s', async (status, corpo, tipo) => {
    simularFetch(responder(status, corpo))
    await expect(buscarEndereco('01452002')).rejects.toMatchObject({
      tipo,
      message: MENSAGENS[tipo],
    })
  })

  it('trata falha de rede como erro de conexão', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))))
    await expect(buscarEndereco('01452002')).rejects.toBeInstanceOf(ApiError)
    await expect(buscarEndereco('01452002')).rejects.toMatchObject({ tipo: 'conexao' })
  })

  it('trata resposta 200 que não é da API (ex.: HTML) como erro de conexão', async () => {
    simularFetch(responder(200, undefined))
    await expect(buscarEndereco('01452002')).rejects.toMatchObject({ tipo: 'conexao' })
  })

  it('repassa cancelamentos sem convertê-los', async () => {
    const abort = Object.assign(new Error('abort'), { name: 'AbortError' })
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(abort)))
    await expect(buscarEndereco('01452002')).rejects.toBe(abort)
  })
})

describe('buscarLocalizacao', () => {
  it('devolve coordenadas e precisão', async () => {
    const fetchFalso = simularFetch(
      responder(200, { latitude: -23.58, longitude: -46.68, precisao: 'logradouro', aproximada: false }),
    )
    const local = await buscarLocalizacao('01452002')
    expect(fetchFalso.mock.calls[0][0]).toBe('/endereco/01452002/localizacao')
    expect(local).toEqual({
      latitude: -23.58,
      longitude: -46.68,
      precisao: 'logradouro',
      aproximada: false,
    })
  })

  it('404 vira "sem_localizacao"', async () => {
    simularFetch(responder(404, { detail: 'Localização não encontrada.' }))
    await expect(buscarLocalizacao('01452002')).rejects.toMatchObject({ tipo: 'sem_localizacao' })
  })

  it.each([503, 502, 500])('HTTP %i vira "mapa_indisponivel"', async (status) => {
    simularFetch(responder(status, { detail: 'x' }))
    await expect(buscarLocalizacao('01452002')).rejects.toMatchObject({ tipo: 'mapa_indisponivel' })
  })

  it('rejeita coordenadas inválidas em vez de inventar posição', async () => {
    simularFetch(responder(200, { latitude: null, longitude: 'x', precisao: 'cidade' }))
    await expect(buscarLocalizacao('01452002')).rejects.toMatchObject({ tipo: 'mapa_indisponivel' })
  })
})
