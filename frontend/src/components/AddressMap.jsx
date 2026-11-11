import { useEffect } from 'react'
import L from 'leaflet'
import { Circle, MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Crosshair, MapPin } from 'lucide-react'
import { useLocalizacao } from '../hooks/useLocalizacao'
import { MapaCarregando, MapaIndisponivel } from './MapMessage'

const ZOOM_POR_PRECISAO = { logradouro: 16, bairro: 14, cidade: 12 }
const RAIO_APROXIMADO_M = { bairro: 900, cidade: 5000 }

const DESCRICAO_PRECISAO = {
  logradouro: 'Posição do logradouro (sem número exato)',
  bairro: 'Localização aproximada: centro do bairro',
  cidade: 'Localização aproximada: centro da cidade',
}

// Marcador próprio em SVG: evita os ícones padrão do Leaflet, que quebram com bundlers.
const ICONE_MARCADOR = L.divIcon({
  className: 'mapa-marcador',
  html: `<svg width="34" height="44" viewBox="0 0 34 44" aria-hidden="true">
    <path d="M17 1C8.2 1 1 8 1 16.700 1 28.500 17 43 17 43s16-14.500 16-26.300C33 8 25.800 1 17 1Z" fill="#e5392f" stroke="#fff" stroke-width="2"/>
    <circle cx="17" cy="16.500" r="5.500" fill="#fff"/>
  </svg>`,
  iconSize: [34, 44],
  iconAnchor: [17, 43],
})

/** Centraliza o mapa sempre que a posição muda (nova consulta). */
function Centralizar({ latitude, longitude, zoom }) {
  const mapa = useMap()
  useEffect(() => {
    mapa.invalidateSize()
    mapa.setView([latitude, longitude], zoom, { animate: true })
  }, [mapa, latitude, longitude, zoom])
  return null
}

export default function AddressMap({ cep, endereco }) {
  const { status, dados, erro } = useLocalizacao(cep)

  if (status === 'loading') return <MapaCarregando />
  if (status === 'error') {
    return (
      <MapaIndisponivel tipo={erro.tipo} mensagem={erro.mensagem} endereco={endereco} />
    )
  }

  const { latitude, longitude, precisao, aproximada } = dados
  const zoom = ZOOM_POR_PRECISAO[precisao] ?? 12
  const raio = RAIO_APROXIMADO_M[precisao]

  return (
    <figure className="mapa" aria-label={`Mapa da localização do CEP ${cep}`}>
      <MapContainer
        center={[latitude, longitude]}
        zoom={zoom}
        scrollWheelZoom={false}
        className="mapa__leaflet"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        {aproximada && raio && (
          <Circle
            center={[latitude, longitude]}
            radius={raio}
            pathOptions={{ color: '#1d6fe8', weight: 1.500, fillOpacity: 0.12 }}
          />
        )}
        <Marker
          position={[latitude, longitude]}
          icon={ICONE_MARCADOR}
          title={endereco.logradouro || endereco.cidade}
        />
        <Centralizar latitude={latitude} longitude={longitude} zoom={zoom} />
      </MapContainer>

      <figcaption
        className={`mapa__selo${aproximada ? ' mapa__selo--aproximada' : ''}`}
      >
        {aproximada ? (
          <Crosshair size={14} aria-hidden="true" />
        ) : (
          <MapPin size={14} aria-hidden="true" />
        )}
        {DESCRICAO_PRECISAO[precisao]}
      </figcaption>
    </figure>
  )
}
