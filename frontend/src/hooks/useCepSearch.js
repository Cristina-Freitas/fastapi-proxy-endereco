import { useCallback, useEffect, useRef, useState } from 'react'
import { buscarEndereco, MENSAGENS } from '../services/enderecoApi'
import { cepValido, formatarCep, somenteDigitos } from '../utils/cep'

const ESTADO_INICIAL = { status: 'idle', endereco: null, erro: null }

/**
 * Estado da consulta de CEP: campo mascarado, carregamento, resultado e erro.
 * `erro.origem` distingue validação local ("validacao") de falhas da API ("api").
 */
export function useCepSearch({ onSucesso } = {}) {
  const [cep, setCep] = useState('')
  const [busca, setBusca] = useState(ESTADO_INICIAL)
  const requisicaoAtual = useRef(null)

  useEffect(() => () => requisicaoAtual.current?.abort(), [])

  const alterarCep = useCallback((valor) => setCep(formatarCep(valor)), [])

  const limparCampo = useCallback(() => {
    setCep('')
    setBusca((atual) =>
      atual.erro?.origem === 'validacao' ? ESTADO_INICIAL : atual,
    )
  }, [])

  const consultar = useCallback(
    async (valor) => {
      const digitos = somenteDigitos(valor)
      requisicaoAtual.current?.abort()

      if (!cepValido(digitos)) {
        setBusca({
          status: 'error',
          endereco: null,
          erro: {
            origem: 'validacao',
            tipo: 'cep_invalido',
            mensagem: MENSAGENS.cep_invalido,
          },
        })
        return
      }

      const controlador = new AbortController()
      requisicaoAtual.current = controlador
      setCep(formatarCep(digitos))
      setBusca({ status: 'loading', endereco: null, erro: null })

      try {
        const dados = await buscarEndereco(digitos, { signal: controlador.signal })
        const endereco = { cep: digitos, ...dados }
        setBusca({ status: 'success', endereco, erro: null })
        onSucesso?.(endereco)
      } catch (erro) {
        if (erro?.name === 'AbortError') return
        setBusca({
          status: 'error',
          endereco: null,
          erro: {
            origem: 'api',
            tipo: erro.tipo ?? 'inesperado',
            mensagem: erro.tipo ? erro.message : MENSAGENS.inesperado,
          },
        })
      }
    },
    [onSucesso],
  )

  return { cep, alterarCep, limparCampo, busca, consultar }
}
