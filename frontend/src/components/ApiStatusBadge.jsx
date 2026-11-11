const ROTULOS = {
  checking: 'Verificando API…',
  online: 'API Online',
  offline: 'API Offline',
}

export default function ApiStatusBadge({ status }) {
  return (
    <p
      id="api-status"
      className={`api-status api-status--${status}`}
      role="status"
      aria-live="polite"
    >
      <span className="api-status__ponto" aria-hidden="true" />
      {ROTULOS[status]}
    </p>
  )
}
