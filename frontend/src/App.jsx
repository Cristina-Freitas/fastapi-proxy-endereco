import { useCallback, useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import Footer from './components/Footer'
import ConsultaPage from './pages/ConsultaPage'
import HistoricoPage from './pages/HistoricoPage'
import SobrePage from './pages/SobrePage'
import { useApiStatus } from './hooks/useApiStatus'
import { useCepSearch } from './hooks/useCepSearch'
import { useHistory } from './hooks/useHistory'

const TITULOS = {
  consulta: 'Consulta de Endereços via ViaCEP',
  historico: 'Histórico de consultas | Endereços ViaCEP',
  sobre: 'Sobre | Endereços ViaCEP',
}

export default function App() {
  const [pagina, setPagina] = useState('consulta')
  const apiStatus = useApiStatus()
  const { historico, registrar, limpar } = useHistory()
  const { cep, alterarCep, limparCampo, busca, consultar } = useCepSearch({
    onSucesso: registrar,
  })

  useEffect(() => {
    document.title = TITULOS[pagina]
    window.scrollTo({ top: 0 })
  }, [pagina])

  // Reconsultar a partir do histórico sempre volta para a página de consulta.
  const consultarNaPaginaInicial = useCallback(
    (valor) => {
      setPagina('consulta')
      consultar(valor)
    },
    [consultar],
  )

  return (
    <div className="app">
      <Sidebar paginaAtual={pagina} onNavegar={setPagina} />

      <div className="app__coluna">
        <main className="app__principal" id="conteudo-principal">
          {pagina === 'consulta' && (
            <ConsultaPage
              apiStatus={apiStatus}
              cep={cep}
              onCepChange={alterarCep}
              onLimparCampo={limparCampo}
              busca={busca}
              onConsultar={consultar}
              historico={historico}
              onLimparHistorico={limpar}
              onVerHistorico={() => setPagina('historico')}
            />
          )}
          {pagina === 'historico' && (
            <HistoricoPage
              apiStatus={apiStatus}
              historico={historico}
              onSelecionar={consultarNaPaginaInicial}
              onLimpar={limpar}
            />
          )}
          {pagina === 'sobre' && <SobrePage apiStatus={apiStatus} />}
        </main>
        <Footer />
      </div>
    </div>
  )
}
