import { LoaderCircle, MapPinned } from 'lucide-react'

export function ResultadoVazio() {
  return (
    <section className="card estado-vazio" aria-labelledby="vazio-titulo">
      <span className="estado-vazio__icone" aria-hidden="true">
        <MapPinned size={34} />
      </span>
      <h2 id="vazio-titulo">Encontre qualquer endereço</h2>
      <p>
        Digite um CEP acima ou escolha um dos exemplos para ver logradouro, bairro,
        cidade, estado, região e a localização no mapa.
      </p>
    </section>
  )
}

export function ResultadoCarregando() {
  return (
    <section
      className="card resultado resultado--carregando"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <header className="resultado__cabecalho">
        <LoaderCircle className="girar" size={22} aria-hidden="true" />
        <h2>Consultando CEP…</h2>
      </header>
      <div className="resultado__corpo" aria-hidden="true">
        <div className="resultado__campos">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="esqueleto esqueleto--campo" />
          ))}
        </div>
        <div className="esqueleto esqueleto--mapa" />
      </div>
    </section>
  )
}
