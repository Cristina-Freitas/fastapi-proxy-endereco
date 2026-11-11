import { LoaderCircle, Search, X } from 'lucide-react'

export const CEPS_EXEMPLO = ['01452002', '88010000', '30140071']

export default function SearchCard({
  valor,
  onChange,
  onSubmit,
  onLimpar,
  onExemplo,
  carregando,
  erroValidacao,
}) {
  function aoEnviar(evento) {
    evento.preventDefault()
    onSubmit()
  }

  return (
    <section className="card busca" aria-labelledby="busca-titulo">
      <form className="busca__form" onSubmit={aoEnviar} noValidate>
        <label id="busca-titulo" className="busca__rotulo" htmlFor="cep">
          CEP
        </label>

        <div className="busca__linha">
          <div className={`campo${erroValidacao ? ' campo--erro' : ''}`}>
            <Search className="campo__icone" size={20} aria-hidden="true" />
            <input
              id="cep"
              name="cep"
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="00000-000"
              maxLength={9}
              value={valor}
              onChange={(e) => onChange(e.target.value)}
              aria-invalid={erroValidacao ? 'true' : 'false'}
              aria-describedby={erroValidacao ? 'cep-erro' : 'cep-ajuda'}
            />
            {valor && (
              <button
                type="button"
                className="campo__limpar"
                onClick={onLimpar}
                aria-label="Limpar campo de CEP"
              >
                <X size={18} aria-hidden="true" />
              </button>
            )}
          </div>

          <button
            id="botao-consultar"
            type="submit"
            className="botao botao--primario"
            disabled={carregando}
          >
            {carregando ? (
              <LoaderCircle className="girar" size={20} aria-hidden="true" />
            ) : (
              <Search size={20} aria-hidden="true" />
            )}
            {carregando ? 'Consultando…' : 'Consultar'}
          </button>
        </div>

        {erroValidacao ? (
          <p id="cep-erro" className="busca__ajuda busca__ajuda--erro" role="alert">
            {erroValidacao}
          </p>
        ) : (
          <p id="cep-ajuda" className="busca__ajuda">
            Digite apenas números (8 dígitos) ou use o formato 00000-000.
          </p>
        )}
      </form>

      <div className="busca__exemplos">
        <h2>Exemplos</h2>
        <p>Clique em um CEP para testar:</p>
        <ul>
          {CEPS_EXEMPLO.map((cep) => (
            <li key={cep}>
              <button
                type="button"
                className="chip"
                onClick={() => onExemplo(cep)}
                disabled={carregando}
              >
                {cep}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
