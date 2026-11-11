"""Testes do backend (unittest + TestClient; sem rede e sem dependências extras).

Execute na raiz do projeto:  python -m unittest discover -s tests -v
"""

import asyncio
import time
import unittest
from unittest.mock import AsyncMock, patch

import httpx
from fastapi.testclient import TestClient

from app import geocoding
from app.main import app

VIACEP_FARIA_LIMA = {
    "cep": "01452-002",
    "logradouro": "Avenida Brigadeiro Faria Lima",
    "bairro": "Itaim Bibi",
    "localidade": "São Paulo",
    "uf": "SP",
    "regiao": "Sudeste",
}

CAMPOS_ENDERECO = {"logradouro", "bairro", "cidade", "estado", "regiao"}


class BaseTestCase(unittest.TestCase):
    def setUp(self):
        geocoding._cache.clear()
        self.client = TestClient(app)
        # Sem espera real entre chamadas ao Nominatim nos testes de rota.
        patcher = patch.object(geocoding, "INTERVALO_MINIMO_SEGUNDOS", 0)
        patcher.start()
        self.addCleanup(patcher.stop)


class TestEndereco(BaseTestCase):
    def test_raiz_responde(self):
        resposta = self.client.get("/")
        self.assertEqual(resposta.status_code, 200)
        self.assertIn("mensagem", resposta.json())

    def test_cep_valido_retorna_somente_os_campos_esperados(self):
        with patch("app.main.consultar_cep", AsyncMock(return_value=VIACEP_FARIA_LIMA)):
            resposta = self.client.get("/endereco/01452002")
        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(
            resposta.json(),
            {
                "logradouro": "Avenida Brigadeiro Faria Lima",
                "bairro": "Itaim Bibi",
                "cidade": "São Paulo",
                "estado": "SP",
                "regiao": "Sudeste",
            },
        )

    def test_cep_invalido_retorna_400(self):
        for cep in ["123", "abcdefgh", "0145200a", "014520020", "01452-02"]:
            with self.subTest(cep=cep):
                resposta = self.client.get(f"/endereco/{cep}")
                self.assertEqual(resposta.status_code, 400)

    def test_cep_inexistente_retorna_404(self):
        with patch("app.main.consultar_cep", AsyncMock(return_value={"erro": "true"})):
            resposta = self.client.get("/endereco/99999999")
        self.assertEqual(resposta.status_code, 404)
        self.assertEqual(resposta.json()["detail"], "CEP não encontrado.")

    def test_falha_do_viacep_retorna_502(self):
        falha = AsyncMock(side_effect=httpx.ConnectError("sem rede"))
        with patch("app.main.consultar_cep", falha):
            resposta = self.client.get("/endereco/01452002")
        self.assertEqual(resposta.status_code, 502)

    def test_timeout_do_viacep_retorna_502(self):
        falha = AsyncMock(side_effect=httpx.ReadTimeout("lento"))
        with patch("app.main.consultar_cep", falha):
            resposta = self.client.get("/endereco/01452002")
        self.assertEqual(resposta.status_code, 502)

    def test_campos_ausentes_viram_texto_vazio(self):
        with patch("app.main.consultar_cep", AsyncMock(return_value={"uf": "SP", "localidade": "São Paulo"})):
            corpo = self.client.get("/endereco/01001000").json()
        self.assertEqual(set(corpo), CAMPOS_ENDERECO)
        self.assertEqual(corpo["logradouro"], "")


class TestLocalizacao(BaseTestCase):
    def consultar(self, nominatim, viacep=VIACEP_FARIA_LIMA, cep="01452002"):
        with patch("app.main.consultar_cep", AsyncMock(return_value=viacep)), patch.object(
            geocoding, "_consultar_nominatim", nominatim
        ):
            return self.client.get(f"/endereco/{cep}/localizacao")

    def test_logradouro_encontrado_nao_e_aproximado(self):
        nominatim = AsyncMock(return_value=(-23.5868, -46.6826))
        resposta = self.consultar(nominatim)
        self.assertEqual(resposta.status_code, 200)
        corpo = resposta.json()
        self.assertEqual(corpo["precisao"], "logradouro")
        self.assertFalse(corpo["aproximada"])
        self.assertEqual(nominatim.await_count, 1)

    def test_fallback_para_bairro_e_marcado_como_aproximado(self):
        nominatim = AsyncMock(side_effect=[None, (-23.5850, -46.6780)])
        corpo = self.consultar(nominatim).json()
        self.assertEqual(corpo["precisao"], "bairro")
        self.assertTrue(corpo["aproximada"])

    def test_fallback_para_cidade_e_marcado_como_aproximado(self):
        nominatim = AsyncMock(side_effect=[None, None, (-23.5506, -46.6333)])
        corpo = self.consultar(nominatim).json()
        self.assertEqual(corpo["precisao"], "cidade")
        self.assertTrue(corpo["aproximada"])
        self.assertEqual(nominatim.await_count, 3)

    def test_ordem_e_parametros_das_buscas(self):
        nominatim = AsyncMock(return_value=None)
        self.consultar(nominatim)
        consultas = [chamada.args[1] for chamada in nominatim.await_args_list]
        self.assertEqual(
            consultas[0],
            {
                "street": "Avenida Brigadeiro Faria Lima",
                "city": "São Paulo",
                "state": "São Paulo",
                "country": "Brasil",
            },
        )
        self.assertEqual(consultas[1], {"q": "Itaim Bibi, São Paulo, São Paulo, Brasil"})
        self.assertEqual(
            consultas[2], {"city": "São Paulo", "state": "São Paulo", "country": "Brasil"}
        )

    def test_sem_logradouro_pula_direto_para_bairro(self):
        viacep = {**VIACEP_FARIA_LIMA, "logradouro": ""}
        nominatim = AsyncMock(return_value=(-23.58, -46.67))
        corpo = self.consultar(nominatim, viacep=viacep).json()
        self.assertEqual(corpo["precisao"], "bairro")

    def test_complemento_do_logradouro_e_removido(self):
        viacep = {**VIACEP_FARIA_LIMA, "logradouro": "Rua Augusta - de 1 a 99 (lado ímpar)"}
        nominatim = AsyncMock(return_value=(-23.5, -46.6))
        self.consultar(nominatim, viacep=viacep)
        self.assertEqual(nominatim.await_args_list[0].args[1]["street"], "Rua Augusta")

    def test_sem_resultado_retorna_404_e_nao_inventa_coordenadas(self):
        nominatim = AsyncMock(return_value=None)
        resposta = self.consultar(nominatim)
        self.assertEqual(resposta.status_code, 404)
        self.assertEqual(resposta.json()["detail"], "Localização não encontrada.")

    def test_nao_localizado_fica_em_cache(self):
        nominatim = AsyncMock(return_value=None)
        self.consultar(nominatim)
        chamadas = nominatim.await_count
        viacep = AsyncMock(side_effect=AssertionError("ViaCEP não deveria ser chamado"))
        with patch("app.main.consultar_cep", viacep), patch.object(
            geocoding, "_consultar_nominatim", nominatim
        ):
            resposta = self.client.get("/endereco/01452002/localizacao")
        self.assertEqual(resposta.status_code, 404)
        self.assertEqual(nominatim.await_count, chamadas)

    def test_segunda_consulta_usa_cache(self):
        nominatim = AsyncMock(return_value=(-23.5868, -46.6826))
        self.consultar(nominatim)
        viacep = AsyncMock(side_effect=AssertionError("ViaCEP não deveria ser chamado"))
        with patch("app.main.consultar_cep", viacep), patch.object(
            geocoding, "_consultar_nominatim", nominatim
        ):
            resposta = self.client.get("/endereco/01452002/localizacao")
        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(nominatim.await_count, 1)

    def test_nominatim_indisponivel_retorna_503_sem_cachear_falha(self):
        nominatim = AsyncMock(side_effect=httpx.ConnectError("fora do ar"))
        resposta = self.consultar(nominatim)
        self.assertEqual(resposta.status_code, 503)
        self.assertEqual(geocoding._cache, {})

    def test_nominatim_com_http_429_retorna_503(self):
        erro = httpx.HTTPStatusError(
            "429", request=httpx.Request("GET", "http://x"), response=httpx.Response(429)
        )
        resposta = self.consultar(AsyncMock(side_effect=erro))
        self.assertEqual(resposta.status_code, 503)

    def test_consulta_do_cep_funciona_mesmo_com_mapa_fora_do_ar(self):
        with patch("app.main.consultar_cep", AsyncMock(return_value=VIACEP_FARIA_LIMA)), patch.object(
            geocoding, "_consultar_nominatim", AsyncMock(side_effect=httpx.ConnectError("x"))
        ):
            endereco = self.client.get("/endereco/01452002")
            localizacao = self.client.get("/endereco/01452002/localizacao")
        self.assertEqual(endereco.status_code, 200)
        self.assertEqual(localizacao.status_code, 503)

    def test_cep_invalido_inexistente_e_falha_do_viacep(self):
        self.assertEqual(self.client.get("/endereco/123/localizacao").status_code, 400)
        with patch("app.main.consultar_cep", AsyncMock(return_value={"erro": "true"})):
            self.assertEqual(self.client.get("/endereco/99999999/localizacao").status_code, 404)
        with patch("app.main.consultar_cep", AsyncMock(side_effect=httpx.ConnectError("x"))):
            self.assertEqual(self.client.get("/endereco/01452002/localizacao").status_code, 502)

    def test_sem_cidade_nao_geocodifica(self):
        nominatim = AsyncMock(return_value=(0.0, 0.0))
        resposta = self.consultar(nominatim, viacep={**VIACEP_FARIA_LIMA, "localidade": ""})
        self.assertEqual(resposta.status_code, 404)
        nominatim.assert_not_awaited()


class TestNominatimCliente(unittest.IsolatedAsyncioTestCase):
    """Testa _consultar_nominatim com um servidor Nominatim simulado."""

    def cliente(self, resultados, capturadas=None):
        def tratador(requisicao: httpx.Request):
            if capturadas is not None:
                capturadas.append(requisicao)
            return httpx.Response(200, json=resultados)

        return httpx.AsyncClient(transport=httpx.MockTransport(tratador))

    async def test_devolve_coordenadas_do_estado_correto(self):
        resultados = [{"lat": "-23.5868", "lon": "-46.6826", "address": {"ISO3166-2-lvl4": "BR-SP"}}]
        async with self.cliente(resultados) as cliente:
            coordenadas = await geocoding._consultar_nominatim(cliente, {"q": "x"}, "SP")
        self.assertEqual(coordenadas, (-23.5868, -46.6826))

    async def test_descarta_resultado_de_outro_estado(self):
        resultados = [{"lat": "-22.9", "lon": "-43.2", "address": {"ISO3166-2-lvl4": "BR-RJ"}}]
        async with self.cliente(resultados) as cliente:
            coordenadas = await geocoding._consultar_nominatim(cliente, {"q": "x"}, "SP")
        self.assertIsNone(coordenadas)

    async def test_sem_resultados_retorna_none(self):
        async with self.cliente([]) as cliente:
            self.assertIsNone(await geocoding._consultar_nominatim(cliente, {"q": "x"}, "SP"))

    async def test_coordenadas_invalidas_retornam_none(self):
        resultados = [{"lat": "abc", "lon": None, "address": {}}]
        async with self.cliente(resultados) as cliente:
            self.assertIsNone(await geocoding._consultar_nominatim(cliente, {"q": "x"}, "SP"))

    async def test_parametros_enviados_ao_nominatim(self):
        capturadas = []
        async with self.cliente([], capturadas) as cliente:
            await geocoding._consultar_nominatim(cliente, {"city": "Florianópolis"}, "SC")
        params = dict(capturadas[0].url.params)
        self.assertEqual(params["limit"], "1")
        self.assertEqual(params["countrycodes"], "br")
        self.assertEqual(params["city"], "Florianópolis")

    async def test_respeita_intervalo_minimo_entre_requisicoes(self):
        with patch.object(geocoding, "INTERVALO_MINIMO_SEGUNDOS", 0.3):
            async with self.cliente([]) as cliente:
                await geocoding._consultar_nominatim(cliente, {"q": "a"}, "SP")
                inicio = time.monotonic()
                await geocoding._consultar_nominatim(cliente, {"q": "b"}, "SP")
                self.assertGreaterEqual(time.monotonic() - inicio, 0.25)

    def test_user_agent_identifica_a_aplicacao(self):
        self.assertIn("fastapi-proxy-endereco", geocoding.USER_AGENT)


class TestGeocodificarComCliente(unittest.IsolatedAsyncioTestCase):
    async def test_user_agent_e_enviado_na_requisicao_real_do_servico(self):
        geocoding._cache.clear()
        capturadas = []

        def tratador(requisicao):
            capturadas.append(requisicao)
            return httpx.Response(
                200,
                json=[{"lat": "-27.59", "lon": "-48.55", "address": {"ISO3166-2-lvl4": "BR-SC"}}],
            )

        original = httpx.AsyncClient

        def cliente_simulado(*args, **kwargs):
            return original(*args, transport=httpx.MockTransport(tratador), **kwargs)

        with patch.object(geocoding.httpx, "AsyncClient", cliente_simulado), patch.object(
            geocoding, "INTERVALO_MINIMO_SEGUNDOS", 0
        ):
            local = await geocoding.geocodificar_endereco(
                "88010000", "Rua Felipe Schmidt", "Centro", "Florianópolis", "SC"
            )

        self.assertEqual(local.precisao, "logradouro")
        self.assertIn("fastapi-proxy-endereco", capturadas[0].headers["user-agent"])
        self.assertEqual(capturadas[0].url.params["state"], "Santa Catarina")


if __name__ == "__main__":
    unittest.main()
