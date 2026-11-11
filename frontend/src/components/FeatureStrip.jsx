import { Laptop, ShieldCheck, Target, Zap } from 'lucide-react'

const DIFERENCIAIS = [
  { Icone: Zap, titulo: 'Resposta rápida', texto: 'Dados em tempo real do ViaCEP' },
  { Icone: ShieldCheck, titulo: 'Informações confiáveis', texto: 'Diretamente da fonte oficial' },
  { Icone: Target, titulo: 'Interface intuitiva', texto: 'Simples e fácil de usar' },
  { Icone: Laptop, titulo: 'Uso em qualquer lugar', texto: 'Acesse pelo computador ou celular' },
]

export default function FeatureStrip() {
  return (
    <section className="card diferenciais" aria-label="Diferenciais">
      <ul>
        {DIFERENCIAIS.map(({ Icone, titulo, texto }) => (
          <li key={titulo}>
            <span className="diferenciais__icone" aria-hidden="true">
              <Icone size={22} />
            </span>
            <div>
              <h2>{titulo}</h2>
              <p>{texto}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
