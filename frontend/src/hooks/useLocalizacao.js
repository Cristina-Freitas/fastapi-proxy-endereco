import { useEffect, useState } from 'react'
import { buscarLocalizacao, MENSAGENS } from '../services/enderecoApi'

// Cache da sessão: reabrir um CEP já localizado não gera nova requisição.
const cache = new Map()

/**
 * Localização do CEP para o mapa. Só dispara quando o CEP muda (nunca por digitação)
 * e falhas aqui não afetam a consulta do endereço.
 */
export function useLocalizacao(cep) {
  const [estado, setEstado] = useState({ status: 'loading', dados: null, erro: null })

  useEffect(() => {
    const emCache = cache.get(cep)
    if (emCache) {
      setEstado({ status: 'success', dados: emCache, erro: null })
      return undefined
    }

    const controlador = new AbortController()
    setEstado({ status: 'loading', dados: null, erro: null })

    buscarLocalizacao(cep, { signal: controlador.signal })
      .then((dados) => {
        cache.set(cep, dados)
        setEstado({ status: 'success', dados, erro: null })
      })
      .catch((erro) => {
        if (erro?.name === 'AbortError') return
        setEstado({
          status: 'error',
          dados: null,
          erro: {
            tipo: erro.tipo ?? 'mapa_indisponivel',
            mensagem: erro.tipo ? erro.message : MENSAGENS.mapa_indisponivel,
          },
        })
      })

    return () => controlador.abort()
  }, [cep])

  return estado
}
