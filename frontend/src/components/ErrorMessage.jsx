import { SearchX, ServerCrash, TriangleAlert, WifiOff } from 'lucide-react'

const ICONES = {
  nao_encontrado: SearchX,
  indisponivel: ServerCrash,
  conexao: WifiOff,
}

const TITULOS = {
  nao_encontrado: 'CEP não encontrado',
  indisponivel: 'Serviço indisponível',
  conexao: 'Sem conexão com o backend',
}

export default function ErrorMessage({ erro }) {
  const Icone = ICONES[erro.tipo] ?? TriangleAlert

  return (
    <section className="card erro" role="alert" aria-labelledby="erro-titulo">
      <span className="erro__icone" aria-hidden="true">
        <Icone size={28} />
      </span>
      <div>
        <h2 id="erro-titulo">{TITULOS[erro.tipo] ?? 'Não foi possível consultar'}</h2>
        <p>{erro.mensagem}</p>
      </div>
    </section>
  )
}
