import { Database, Globe, Layers, Server } from 'lucide-react'
import Hero from '../components/Hero'

const TECNOLOGIAS = [
  {
    Icone: Layers,
    titulo: 'Frontend',
    itens: ['React', 'Vite', 'JavaScript', 'CSS3', 'React Leaflet', 'Lucide React', 'Vitest'],
  },
  {
    Icone: Server,
    titulo: 'Backend',
    itens: ['Python', 'FastAPI', 'Pydantic', 'HTTPX', 'Uvicorn', 'Pytest'],
  },
  {
    Icone: Database,
    titulo: 'Dados',
    itens: ['ViaCEP (endereços)', 'LocalStorage (histórico)'],
  },
  {
    Icone: Globe,
    titulo: 'Mapa',
    itens: ['OpenStreetMap (mapa)', 'Nominatim (geocodificação)', 'Leaflet'],
  },
]

export default function SobrePage({ apiStatus }) {
  return (
    <>
      <Hero
        compacto
        apiStatus={apiStatus}
        titulo={
          <>
            Sobre o <span className="destaque">projeto</span>
          </>
        }
        descricao="Consulta de endereços brasileiros a partir do CEP."
      />

      <div className="conteudo conteudo--sobreposto sobre">
        <section className="card sobre__bloco" aria-labelledby="sobre-objetivo">
          <h2 id="sobre-objetivo">Objetivo</h2>
          <p>
            O <strong>API Proxy de Endereço</strong> demonstra como construir um
            proxy com FastAPI para o ViaCEP e consumi-lo em uma interface moderna.
            O navegador conversa apenas com a API do projeto, que consulta o ViaCEP e
            devolve logradouro, bairro, cidade, estado e região.
          </p>
          <p>
            Depois de cada consulta, o endereço é localizado no mapa. Como o CEP não
            informa o número do imóvel, a posição mostrada é a do logradouro ou, quando
            ele não é encontrado, uma área aproximada do bairro ou da cidade — sempre
            identificada na tela.
          </p>
        </section>

        <section className="card sobre__bloco" aria-labelledby="sobre-fluxo">
          <h2 id="sobre-fluxo">Como funciona</h2>
          <ol className="sobre__fluxo">
            <li>Você informa o CEP e o frontend valida os 8 dígitos.</li>
            <li>
              O frontend chama <code>GET /endereco/&#123;cep&#125;</code> na API FastAPI.
            </li>
            <li>A API consulta o ViaCEP e retorna os campos do endereço.</li>
            <li>
              Em seguida, <code>GET /endereco/&#123;cep&#125;/localizacao</code> busca as
              coordenadas no Nominatim, com cache e limite de uma requisição por segundo.
            </li>
            <li>Consultas bem-sucedidas ficam salvas no histórico deste navegador.</li>
          </ol>
        </section>

        <section className="sobre__tecnologias" aria-labelledby="sobre-tecnologias">
          <h2 id="sobre-tecnologias" className="sobre__titulo-secao">
            Tecnologias utilizadas
          </h2>
          <div className="sobre__grade">
            {TECNOLOGIAS.map(({ Icone, titulo, itens }) => (
              <article key={titulo} className="card sobre__tecnologia">
                <span className="diferenciais__icone" aria-hidden="true">
                  <Icone size={22} />
                </span>
                <h3>{titulo}</h3>
                <ul>
                  {itens.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
