"""Geocodificação de endereços com o Nominatim (OpenStreetMap).

Respeita a política de uso do serviço público
(https://operations.osmfoundation.org/policies/nominatim/):

- identifica a aplicação com um User-Agent próprio;
- no máximo uma requisição por segundo (serializada por um lock);
- resultados em cache, para nunca repetir a mesma consulta;
- sem geocodificação a cada digitação: só ocorre após um CEP válido.
"""

import asyncio
import os
import re
import time
from dataclasses import dataclass
from typing import Optional

import httpx

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = os.getenv(
    "NOMINATIM_USER_AGENT",
    "fastapi-proxy-endereco/1.0 "
    "(+https://github.com/Cristina-Freitas/fastapi-proxy-endereco)",
)

INTERVALO_MINIMO_SEGUNDOS = 1.1  # política do Nominatim: máx. 1 req/s
TTL_ENCONTRADO_SEGUNDOS = 7 * 24 * 3600
TTL_NAO_ENCONTRADO_SEGUNDOS = 3600
MAX_ENTRADAS_CACHE = 1000

ESTADOS = {
    "AC": "Acre", "AL": "Alagoas", "AP": "Amapá", "AM": "Amazonas",
    "BA": "Bahia", "CE": "Ceará", "DF": "Distrito Federal",
    "ES": "Espírito Santo", "GO": "Goiás", "MA": "Maranhão",
    "MT": "Mato Grosso", "MS": "Mato Grosso do Sul", "MG": "Minas Gerais",
    "PA": "Pará", "PB": "Paraíba", "PR": "Paraná", "PE": "Pernambuco",
    "PI": "Piauí", "RJ": "Rio de Janeiro", "RN": "Rio Grande do Norte",
    "RS": "Rio Grande do Sul", "RO": "Rondônia", "RR": "Roraima",
    "SC": "Santa Catarina", "SP": "São Paulo", "SE": "Sergipe",
    "TO": "Tocantins",
}


class GeocodingUnavailable(Exception):
    """O serviço de geocodificação não respondeu como esperado."""


@dataclass(frozen=True)
class Localizacao:
    latitude: float
    longitude: float
    precisao: str  # "logradouro" | "bairro" | "cidade"


# cep -> (expira_em, resultado). resultado None = endereço não localizado.
_cache: dict[str, tuple[float, Optional[Localizacao]]] = {}
_lock = asyncio.Lock()
_ultima_requisicao = 0.0


def obter_do_cache(cep: str) -> tuple[bool, Optional[Localizacao]]:
    """Retorna (encontrou_no_cache, resultado)."""
    item = _cache.get(cep)
    if item is None:
        return False, None
    expira_em, resultado = item
    if expira_em < time.monotonic():
        del _cache[cep]
        return False, None
    return True, resultado


def _guardar_no_cache(cep: str, resultado: Optional[Localizacao]) -> None:
    if len(_cache) >= MAX_ENTRADAS_CACHE:
        # Remove a entrada mais antiga (dicts preservam a ordem de inserção).
        _cache.pop(next(iter(_cache)))
    ttl = TTL_ENCONTRADO_SEGUNDOS if resultado else TTL_NAO_ENCONTRADO_SEGUNDOS
    _cache[cep] = (time.monotonic() + ttl, resultado)


def _limpar_logradouro(logradouro: str) -> str:
    """Remove complementos como "- de 1 a 99" ou "(lado par)"."""
    return re.split(r"\s+-\s+|\(", logradouro)[0].strip()


def _montar_tentativas(
    logradouro: str, bairro: str, cidade: str, uf: str
) -> list[tuple[str, dict]]:
    """Da busca mais precisa para a mais genérica."""
    estado = ESTADOS.get(uf.upper(), uf)
    tentativas: list[tuple[str, dict]] = []

    rua = _limpar_logradouro(logradouro)
    if rua:
        tentativas.append(
            ("logradouro", {"street": rua, "city": cidade, "state": estado, "country": "Brasil"})
        )
    if bairro:
        tentativas.append(
            ("bairro", {"q": f"{bairro}, {cidade}, {estado}, Brasil"})
        )
    tentativas.append(
        ("cidade", {"city": cidade, "state": estado, "country": "Brasil"})
    )
    return tentativas


async def _consultar_nominatim(
    cliente: httpx.AsyncClient, consulta: dict, uf: str
) -> Optional[tuple[float, float]]:
    global _ultima_requisicao

    espera = INTERVALO_MINIMO_SEGUNDOS - (time.monotonic() - _ultima_requisicao)
    if espera > 0:
        await asyncio.sleep(espera)
    _ultima_requisicao = time.monotonic()

    resposta = await cliente.get(
        NOMINATIM_URL,
        params={
            **consulta,
            "format": "jsonv2",
            "limit": 1,
            "addressdetails": 1,
            "countrycodes": "br",
            "accept-language": "pt-BR",
        },
    )
    resposta.raise_for_status()
    resultados = resposta.json()
    if not resultados:
        return None

    resultado = resultados[0]
    # Descarta resultados de outro estado (homônimos).
    iso_estado = resultado.get("address", {}).get("ISO3166-2-lvl4")
    if iso_estado and iso_estado != f"BR-{uf.upper()}":
        return None

    try:
        return float(resultado["lat"]), float(resultado["lon"])
    except (KeyError, TypeError, ValueError):
        return None


async def geocodificar_endereco(
    cep: str, logradouro: str, bairro: str, cidade: str, uf: str
) -> Optional[Localizacao]:
    """Localiza o endereço do CEP. Retorna None se não houver resultado confiável.

    Levanta GeocodingUnavailable se o serviço estiver indisponível.
    """
    if not cidade or not uf:
        return None

    async with _lock:
        # Outra requisição pode ter preenchido o cache enquanto aguardávamos.
        encontrou, resultado = obter_do_cache(cep)
        if encontrou:
            return resultado

        try:
            async with httpx.AsyncClient(
                timeout=8.0, headers={"User-Agent": USER_AGENT}
            ) as cliente:
                for precisao, consulta in _montar_tentativas(
                    logradouro, bairro, cidade, uf
                ):
                    coordenadas = await _consultar_nominatim(cliente, consulta, uf)
                    if coordenadas:
                        localizacao = Localizacao(*coordenadas, precisao=precisao)
                        _guardar_no_cache(cep, localizacao)
                        return localizacao
        except (httpx.HTTPError, ValueError) as erro:
            raise GeocodingUnavailable(str(erro)) from erro

        _guardar_no_cache(cep, None)
        return None
