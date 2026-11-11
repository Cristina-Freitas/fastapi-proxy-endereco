import { LoaderCircle, MapPinOff, ServerOff } from 'lucide-react'

export function MapaCarregando() {
  return (
    <div className="mapa-mensagem" role="status" aria-live="polite">
      <LoaderCircle className="girar" size={28} aria-hidden="true" />
      <p>Localizando no mapa…</p>
    </div>
  )
}

/** Cartão informativo exibido no lugar do mapa quando não há localização. */
export function MapaIndisponivel({ tipo, mensagem, endereco }) {
  const Icone = tipo === 'sem_localizacao' ? MapPinOff : ServerOff
  const resumo = [endereco.logradouro, endereco.bairro, endereco.cidade && `${endereco.cidade}/${endereco.estado}`]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="mapa-mensagem" role="status">
      <span className="mapa-mensagem__icone" aria-hidden="true">
        <Icone size={26} />
      </span>
      <p className="mapa-mensagem__titulo">{mensagem}</p>
      {resumo && <p className="mapa-mensagem__detalhe">{resumo}</p>}
    </div>
  )
}
