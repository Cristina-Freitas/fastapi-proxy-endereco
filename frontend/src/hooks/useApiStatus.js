import { useCallback, useEffect, useState } from 'react'
import { verificarApi } from '../services/enderecoApi'

/** Disponibilidade da API via GET /api-status: 'checking' | 'online' | 'offline'. */
export function useApiStatus(intervaloMs = 30000) {
  const [status, setStatus] = useState('checking')

  const verificar = useCallback(async () => {
    const disponivel = await verificarApi()
    setStatus(disponivel ? 'online' : 'offline')
  }, [])

  useEffect(() => {
    verificar()
    const temporizador = setInterval(verificar, intervaloMs)
    window.addEventListener('focus', verificar)
    return () => {
      clearInterval(temporizador)
      window.removeEventListener('focus', verificar)
    }
  }, [verificar, intervaloMs])

  return status
}
