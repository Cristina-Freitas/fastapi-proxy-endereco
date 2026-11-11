import { Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="rodape">
      <p>
        API Proxy de Endereço <span aria-hidden="true">v1.0.0 | </span>
        <span className="sr-only">versão 1.0.0, </span>
        ViaCEP
      </p>
      <p>
        Desenvolvido com <Heart size={14} className="rodape__coracao" aria-label="amor" /> por
        Cristina Freitas
      </p>
    </footer>
  )
}
