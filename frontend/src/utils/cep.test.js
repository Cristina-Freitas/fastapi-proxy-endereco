import { describe, expect, it } from 'vitest'
import { cepValido, formatarCep, somenteDigitos } from './cep'

describe('somenteDigitos', () => {
  it('remove hífen e demais caracteres não numéricos', () => {
    expect(somenteDigitos('01452-002')).toBe('01452002')
    expect(somenteDigitos(' 01.452-002 abc')).toBe('01452002')
  })

  it('aceita valor vazio', () => {
    expect(somenteDigitos()).toBe('')
  })
})

describe('formatarCep', () => {
  it('aplica a máscara 00000-000 progressivamente', () => {
    expect(formatarCep('0')).toBe('0')
    expect(formatarCep('01452')).toBe('01452')
    expect(formatarCep('014520')).toBe('01452-0')
    expect(formatarCep('01452002')).toBe('01452-002')
  })

  it('limita a 8 dígitos e ignora letras', () => {
    expect(formatarCep('0145200299')).toBe('01452-002')
    expect(formatarCep('a1b4c5d')).toBe('145')
  })

  it('mantém o valor idempotente', () => {
    expect(formatarCep(formatarCep('01452002'))).toBe('01452-002')
  })
})

describe('cepValido', () => {
  it('exige exatamente 8 dígitos', () => {
    expect(cepValido('01452-002')).toBe(true)
    expect(cepValido('01452002')).toBe(true)
    expect(cepValido('01452-00')).toBe(false)
    expect(cepValido('014520023')).toBe(false)
    expect(cepValido('')).toBe(false)
    expect(cepValido('abcdefgh')).toBe(false)
  })
})
