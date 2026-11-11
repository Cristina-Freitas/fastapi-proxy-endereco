export const CEP_TAMANHO = 8

export function somenteDigitos(valor = '') {
  return String(valor).replace(/\D/g, '')
}

/** Mantém no máximo 8 dígitos e aplica a máscara 00000-000. */
export function formatarCep(valor = '') {
  const digitos = somenteDigitos(valor).slice(0, CEP_TAMANHO)
  return digitos.length > 5
    ? `${digitos.slice(0, 5)}-${digitos.slice(5)}`
    : digitos
}

/** Um CEP só é válido com exatamente 8 dígitos, ignorando hífen e outros caracteres. */
export function cepValido(valor = '') {
  return somenteDigitos(valor).length === CEP_TAMANHO
}
