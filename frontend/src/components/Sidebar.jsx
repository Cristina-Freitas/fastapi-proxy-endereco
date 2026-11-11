import { Clock, House, Info, MapPin } from 'lucide-react'

const ITENS = [
  { id: 'consulta', rotulo: 'Consultar CEP', Icone: House },
  { id: 'historico', rotulo: 'Histórico', Icone: Clock },
  { id: 'sobre', rotulo: 'Sobre', Icone: Info },
]

function OndasDecorativas() {
  return (
    <svg
      className="sidebar__ondas"
      viewBox="0 0 220 360"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {Array.from({ length: 11 }, (_, i) => (
        <path
          key={i}
          d={`M-20 ${150 + i * 14} C 40 ${90 + i * 14}, 90 ${250 + i * 12}, 240 ${130 + i * 16}`}
          stroke="currentColor"
          strokeWidth="1"
          opacity={0.35 - i * 0.02}
        />
      ))}
    </svg>
  )
}

export default function Sidebar({ paginaAtual, onNavegar }) {
  return (
    <aside className="sidebar">
      <div className="sidebar__marca">
        <span className="sidebar__logo" aria-hidden="true">
          <MapPin size={24} strokeWidth={2.4} />
        </span>
        <p className="sidebar__nome">
          Endereços
          <span>ViaCEP</span>
        </p>
      </div>

      <nav className="sidebar__nav" aria-label="Navegação principal">
        {ITENS.map(({ id, rotulo, Icone }) => (
          <button
            key={id}
            id={`nav-${id}`}
            type="button"
            className="sidebar__item"
            aria-current={paginaAtual === id ? 'page' : undefined}
            onClick={() => onNavegar(id)}
          >
            <Icone size={18} aria-hidden="true" />
            <span>{rotulo}</span>
          </button>
        ))}
      </nav>

      <OndasDecorativas />

      <figure className="sidebar__lema">
        <blockquote>“Conectando pessoas e lugares.”</blockquote>
      </figure>
    </aside>
  )
}
