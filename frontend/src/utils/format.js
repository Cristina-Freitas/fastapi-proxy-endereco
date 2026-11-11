const formatoData = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})
const formatoHora = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
})

export function formatarDataHora(iso) {
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return { data: '', hora: '' }
  return { data: formatoData.format(data), hora: formatoHora.format(data) }
}

/** "Cidade – UF", omitindo as partes ausentes. */
export function formatarCidadeUf(cidade, estado) {
  return [cidade, estado].filter(Boolean).join(' – ')
}
