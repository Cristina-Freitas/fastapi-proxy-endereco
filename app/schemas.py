
from pydantic import BaseModel


class EnderecoResponse(BaseModel):
    logradouro: str
    bairro: str
    estado: str
    regiao: str
