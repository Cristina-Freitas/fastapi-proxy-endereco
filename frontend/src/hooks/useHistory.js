import { useCallback, useEffect, useState } from 'react'
import {
  adicionarAoHistorico,
  carregarHistorico,
  limparHistoricoSalvo,
  salvarHistorico,
} from '../services/historyStorage'

/** Histórico de consultas bem-sucedidas, persistido no LocalStorage. */
export function useHistory() {
  const [historico, setHistorico] = useState(carregarHistorico)

  useEffect(() => {
    salvarHistorico(historico)
  }, [historico])

  const registrar = useCallback((endereco) => {
    const entrada = { ...endereco, consultadoEm: new Date().toISOString() }
    setHistorico((atual) => adicionarAoHistorico(atual, entrada))
  }, [])

  const limpar = useCallback(() => {
    setHistorico([])
    limparHistoricoSalvo()
  }, [])

  return { historico, registrar, limpar }
}
