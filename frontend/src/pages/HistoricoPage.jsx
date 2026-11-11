import Hero from '../components/Hero'
import HistoryPanel from '../components/HistoryPanel'

export default function HistoricoPage({ apiStatus, historico, onSelecionar, onLimpar }) {
  return (
    <>
      <Hero
        compacto
        apiStatus={apiStatus}
        titulo={
          <>
            Histórico de <span className="destaque">consultas</span>
          </>
        }
        descricao="Os CEPs consultados com sucesso ficam salvos neste navegador. Clique em um deles para consultar novamente."
      />
      <div className="conteudo conteudo--sobreposto">
        <HistoryPanel
          historico={historico}
          onSelecionar={onSelecionar}
          onLimpar={onLimpar}
        />
      </div>
    </>
  )
}
