
from typing import Literal

from pydantic import BaseModel


class EnderecoResponse(BaseModel):
    logradouro: str
    bairro: str
    cidade: str
    estado: str
    regiao: str


class LocalizacaoResponse(BaseModel):
    latitude: float
    longitude: float
    # Nível do endereço que o geocodificador conseguiu localizar.
    precisao: Literal["logradouro", "bairro", "cidade"]
    # True quando a posição não é a do logradouro (bairro ou cidade).
    aproximada: bool
    fonte: str = "OpenStreetMap Nominatim"
