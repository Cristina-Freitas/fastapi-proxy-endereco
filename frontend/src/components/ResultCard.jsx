import { Suspense, lazy } from 'react'
import {
  Building2,
  CircleCheck,
  Compass,
  Landmark,
  Map,
  MapPin,
  Route,
} from 'lucide-react'
import AddressField from './AddressField'
import { MapaCarregando } from './MapMessage'
import { formatarCep } from '../utils/cep'

// Leaflet só é baixado quando existe um resultado para exibir.
const AddressMap = lazy(() => import('./AddressMap'))

const CAMPOS = [
  { chave: 'logradouro', rotulo: 'Logradouro', Icone: Route },
  { chave: 'bairro', rotulo: 'Bairro', Icone: Building2 },
  { chave: 'cidade', rotulo: 'Cidade', Icone: Landmark },
  { chave: 'estado', rotulo: 'Estado', Icone: Map },
  { chave: 'regiao', rotulo: 'Região', Icone: Compass },
]

export default function ResultCard({ endereco }) {
  return (
    <article className="card resultado" aria-labelledby="resultado-titulo">
      <header className="resultado__cabecalho">
        <span className="resultado__pin" aria-hidden="true">
          <MapPin size={20} />
        </span>
        <div>
          <h2 id="resultado-titulo">Endereço encontrado</h2>
          <p>CEP {formatarCep(endereco.cep)}</p>
        </div>
        <p className="selo-valido">
          <CircleCheck size={18} aria-hidden="true" />
          CEP válido
        </p>
      </header>

      <div className="resultado__corpo">
        <dl className="resultado__campos">
          {CAMPOS.map(({ chave, rotulo, Icone }) => (
            <AddressField
              key={chave}
              Icone={Icone}
              rotulo={rotulo}
              valor={endereco[chave]}
            />
          ))}
        </dl>

        <div className="resultado__mapa">
          <Suspense fallback={<MapaCarregando />}>
            <AddressMap cep={endereco.cep} endereco={endereco} />
          </Suspense>
        </div>
      </div>
    </article>
  )
}
