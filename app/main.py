
from fastapi import FastAPI, HTTPException
from app.schemas import EnderecoResponse
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
        "estado": dados.get("uf", ""),
        "regiao": dados.get("regiao", "")
    }

