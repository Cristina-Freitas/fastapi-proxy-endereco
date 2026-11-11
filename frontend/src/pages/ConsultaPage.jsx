import Hero from '../components/Hero'
import SearchCard from '../components/SearchCard'
import ResultCard from '../components/ResultCard'
import ErrorMessage from '../components/ErrorMessage'
import { ResultadoCarregando, ResultadoVazio } from '../components/ResultStates'
import HistoryPanel from '../components/HistoryPanel'
import FeatureStrip from '../components/FeatureStrip'

const ITENS_NO_PAINEL = 5

function AreaResultado({ busca }) {
  if (busca.status === 'loading') return <ResultadoCarregando />
  if (busca.status === 'success') return <ResultCard endereco={busca.endereco} />
  if (busca.erro && busca.erro.origem !== 'validacao') {
    return <ErrorMessage erro={busca.erro} />
  }
  return <ResultadoVazio />
}

export default function ConsultaPage({
  apiStatus,
  cep,
  onCepChange,
  onLimparCampo,
  busca,
  onConsultar,
  historico,
  onLimparHistorico,
  onVerHistorico,
}) {
  const erroValidacao =
    busca.erro?.origem === 'validacao' ? busca.erro.mensagem : null

  return (
    <>
      <Hero
        apiStatus={apiStatus}
        titulo={
          <>
            Consulta de Endereços
            <br />
            via <span className="destaque">ViaCEP</span>
          </>
        }
        descricao="Informe um CEP e obtenha as principais informações de endereço de forma rápida e confiável."
      />

      <div className="conteudo conteudo--sobreposto">
        <SearchCard
          valor={cep}
          onChange={onCepChange}
          onSubmit={() => onConsultar(cep)}
          onLimpar={onLimparCampo}
          onExemplo={onConsultar}
          carregando={busca.status === 'loading'}
          erroValidacao={erroValidacao}
        />

        <div className="grade-resultados">
          <div className="grade-resultados__principal" aria-live="polite">
            <AreaResultado busca={busca} />
          </div>
          <HistoryPanel
            historico={historico}
            limite={ITENS_NO_PAINEL}
            onSelecionar={onConsultar}
            onLimpar={onLimparHistorico}
            onVerTudo={onVerHistorico}
          />
        </div>

        <FeatureStrip />
      </div>
    </>
  )
}
