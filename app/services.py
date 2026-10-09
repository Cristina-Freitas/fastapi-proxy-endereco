
import httpx


async def consultar_cep(cep: str):
    url = f"https://viacep.com.br/ws/{cep}/json/"

    async with httpx.AsyncClient(timeout=10.0) as cliente:
        resposta = await cliente.get(url)
        resposta.raise_for_status()

    return resposta.json()
