
from fastapi import FastAPI, HTTPException
from app.geocoding import (
    GeocodingUnavailable,
    geocodificar_endereco,
    obter_do_cache,
)
from app.schemas import EnderecoResponse, LocalizacaoResponse
from app.services import consultar_cep
import httpx

app = FastAPI(
    title="API Proxy de Endereço",
    description="Consulta de endereços via ViaCEP",
    version="1.0.0"
)


@app.get("/")
def inicio():
    return {"mensagem": "API de endereços funcionando!"}


@app.get("/endereco/{cep}", response_model=EnderecoResponse)
async def buscar_endereco(cep: str):

    # Verifica se o CEP possui exatamente 8 dígitos
    if not cep.isdigit() or len(cep) != 8:
        raise HTTPException(
            status_code=400,
            detail="O CEP deve conter exatamente 8 números."
        )

    # Consulta o serviço externo ViaCEP
    try:
        dados = await consultar_cep(cep)
    except httpx.HTTPError:
        raise HTTPException(
            status_code=502,
            detail="Não foi possível consultar o ViaCEP."
        )

    # Verifica se o CEP foi encontrado
    if dados.get("erro"):
        raise HTTPException(
            status_code=404,
            detail="CEP não encontrado."
        )

    # Retorna somente os campos solicitados
    return {
        "logradouro": dados.get("logradouro", ""),
        "bairro": dados.get("bairro", ""),
        "cidade": dados.get("localidade", ""),
        "estado": dados.get("uf", ""),
        "regiao": dados.get("regiao", "")
    }


@app.get("/endereco/{cep}/localizacao", response_model=LocalizacaoResponse)
async def buscar_localizacao(cep: str):
    """Geolocaliza o endereço de um CEP para exibição no mapa.

    Endpoint separado de /endereco/{cep}: se o serviço de mapas falhar,
    a consulta do CEP continua funcionando.
    """

    if not cep.isdigit() or len(cep) != 8:
        raise HTTPException(
            status_code=400,
            detail="O CEP deve conter exatamente 8 números."
        )

    # Cache primeiro: evita ViaCEP e Nominatim em consultas repetidas
    em_cache, localizacao = obter_do_cache(cep)

    if not em_cache:
        try:
            dados = await consultar_cep(cep)
        except httpx.HTTPError:
            raise HTTPException(
                status_code=502,
                detail="Não foi possível consultar o ViaCEP."
            )

        if dados.get("erro"):
            raise HTTPException(
                status_code=404,
                detail="CEP não encontrado."
            )

        try:
            localizacao = await geocodificar_endereco(
                cep=cep,
                logradouro=dados.get("logradouro", ""),
                bairro=dados.get("bairro", ""),
                cidade=dados.get("localidade", ""),
                uf=dados.get("uf", ""),
            )
        except GeocodingUnavailable:
            raise HTTPException(
                status_code=503,
                detail="Serviço de mapas temporariamente indisponível."
            )

    if localizacao is None:
        raise HTTPException(
            status_code=404,
            detail="Localização não encontrada."
        )

    return {
        "latitude": localizacao.latitude,
        "longitude": localizacao.longitude,
        "precisao": localizacao.precisao,
        "aproximada": localizacao.precisao != "logradouro",
    }

