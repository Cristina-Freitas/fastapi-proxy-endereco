import florianopolis from '../assets/florianopolis.png'
import ApiStatusBadge from './ApiStatusBadge'

export default function Hero({ titulo, descricao, apiStatus, compacto = false }) {
  return (
    <header className={`hero${compacto ? ' hero--compacto' : ''}`}>
      <img className="hero__imagem" src={florianopolis} alt="" aria-hidden="true" />
      <div className="hero__status">
        <ApiStatusBadge status={apiStatus} />
      </div>
      <div className="hero__texto">
        <h1>{titulo}</h1>
        {descricao && <p>{descricao}</p>}
      </div>
    </header>
  )
}
