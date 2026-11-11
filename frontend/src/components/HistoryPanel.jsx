import { Clock, MapPin } from 'lucide-react'
import { formatarCep } from '../utils/cep'
import { formatarCidadeUf, formatarDataHora } from '../utils/format'

function ItemHistorico({ item, destaque, onSelecionar }) {
  const { data, hora } = formatarDataHora(item.consultadoEm)
  const local = formatarCidadeUf(item.cidade, item.estado)

  return (
    <li>
      <button
        type="button"
        className="historico__item"
        onClick={() => onSelecionar(item.cep)}
        aria-label={`Consultar novamente o CEP ${formatarCep(item.cep)}, ${local}`}
      >
        <MapPin
          className={`historico__pin${destaque ? ' historico__pin--ativo' : ''}`}
          size={18}
          aria-hidden="true"
        />
        <span className="historico__dados">
          <strong>{formatarCep(item.cep)}</strong>
          <span>{local || item.logradouro || '—'}</span>
        </span>
        <time className="historico__data" dateTime={item.consultadoEm}>
          {data}
          <span>{hora}</span>
        </time>
      </button>
    </li>
  )
}

/**
 * Lista de consultas anteriores. `limite` restringe a quantidade exibida
 * (painel lateral); sem limite mostra tudo (página Histórico).
 */
export default function HistoryPanel({
  historico,
  limite,
  onSelecionar,
  onLimpar,
  onVerTudo,
}) {
  const itens = limite ? historico.slice(0, limite) : historico
  const restantes = historico.length - itens.length

  return (
    <section className="card historico" aria-labelledby="historico-titulo">
      <header className="historico__cabecalho">
        <Clock size={20} aria-hidden="true" />
        <h2 id="historico-titulo">Histórico de consultas</h2>
        {historico.length > 0 && (
          <button
            id="limpar-historico"
            type="button"
            className="link-botao"
            onClick={onLimpar}
          >
            Limpar
          </button>
        )}
      </header>

      {itens.length === 0 ? (
        <p className="historico__vazio">
          Suas consultas bem-sucedidas aparecerão aqui.
        </p>
      ) : (
        <ul className="historico__lista">
          {itens.map((item, indice) => (
            <ItemHistorico
              key={item.cep}
              item={item}
              destaque={indice === 0}
              onSelecionar={onSelecionar}
            />
          ))}
        </ul>
      )}

      {restantes > 0 && onVerTudo && (
        <button type="button" className="link-botao historico__ver-tudo" onClick={onVerTudo}>
          Ver todas as {historico.length} consultas
        </button>
      )}
    </section>
  )
}
