# Fastapi-proxy-endereco

API REST desenvolvida com FastAPI para consulta de endereços via ViaCEP, utilizando Pydantic e requisições assíncronas, acompanhada de um frontend em React com histórico de consultas e mapa interativo.

## Funcionalidades

- Consulta de CEP com máscara `00000-000` e validação de 8 dígitos.
- Resultado com logradouro, bairro, cidade, estado e região, e selo "CEP válido".
- Mensagens amigáveis para CEP inválido (400), não encontrado (404), serviço indisponível (502) e falha de conexão com o backend.
- Mapa real (React Leaflet + OpenStreetMap) com marcador, centralizado no endereço consultado. Quando o logradouro não é localizado, a posição é aproximada pelo bairro ou pela cidade e isso é indicado na tela. Se não houver localização confiável, um aviso é exibido no lugar do mapa.
- Histórico das consultas bem-sucedidas no LocalStorage (reconsultar com um clique, limpar, persiste ao atualizar a página).
- Indicador "API Online/Offline" baseado em `GET /`.
- Páginas: **Consultar CEP**, **Histórico** e **Sobre**. Layout responsivo (desktop, tablet e celular).

## Estrutura

```
fastapi-proxy-endereco/
├── app/
│   ├── __init__.py
│   ├── main.py         # rotas FastAPI
│   ├── schemas.py      # modelos Pydantic
│   ├── services.py     # consulta ao ViaCEP
│   └── geocoding.py    # geocodificação (Nominatim) com cache e limite de taxa
├── frontend/
│   ├── src/
│   │   ├── components/ # Sidebar, Hero, SearchCard, ResultCard, AddressMap, HistoryPanel...
│   │   ├── pages/      # ConsultaPage, HistoricoPage, SobrePage
│   │   ├── hooks/      # useCepSearch, useHistory, useLocalizacao, useApiStatus
│   │   ├── services/   # enderecoApi (fetch) e historyStorage (LocalStorage)
│   │   ├── utils/      # máscara/validação de CEP e formatadores
│   │   ├── App.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js  # proxy para o FastAPI
├── scripts/
│   ├── setup.js        # npm run setup: cria o .venv e instala todas as dependências
│   ├── run-api.js      # sobe o uvicorn com o Python do .venv (Windows, Linux e macOS)
│   └── venv.js         # caminho do Python do .venv conforme o sistema
├── tests/              # testes do backend
├── package.json        # scripts da raiz: setup, dev, dev:api e dev:web
├── requirements.txt
└── README.md
```

## Como executar

### Pré-requisitos

- **Python 3.10 ou superior**: confira com `python --version` (Windows) ou `python3 --version` (Linux/macOS).
- **Node.js 20 ou superior**, com npm: confira com `node --version`.
- **Somente Debian/Ubuntu:** o módulo de ambientes virtuais vem em um pacote separado: `sudo apt install python3-venv`.

### Início rápido (comando único)

Funciona igual no Windows (PowerShell, CMD ou Git Bash), no Linux e no macOS:

```bash
git clone https://github.com/Cristina-Freitas/fastapi-proxy-endereco.git
cd fastapi-proxy-endereco
npm run setup   # só na primeira vez
npm run dev
```

- `npm run setup` cria o ambiente virtual `.venv` (se ainda não existir), instala as dependências Python do `requirements.txt` e as dependências Node da raiz e do `frontend/`. Pode ser rodado de novo a qualquer momento, por exemplo depois de atualizar as dependências.
- `npm run dev` sobe o backend e o frontend juntos no mesmo terminal, com a saída identificada por `[api]` e `[web]`. Não é preciso ativar o venv.
- **Ctrl+C** encerra os dois. Se um deles cair, o outro também é encerrado.

| O quê | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://127.0.0.1:8000 |
| Documentação da API (Swagger) | http://127.0.0.1:8000/docs |

O Vite encaminha `/endereco` e `/api-status` para a API em `127.0.0.1:8000`, então não há CORS e o frontend nunca consulta o ViaCEP diretamente. Por isso a API precisa estar nessa porta. Se a 8000 ou a 5173 já estiverem em uso (por exemplo, por outra execução do projeto), encerre o processo que as ocupa antes de rodar `npm run dev`.

### Alternativa: backend e frontend em terminais separados

Útil para ver os logs de cada um isoladamente. Depois do `npm run setup`, você pode usar `npm run dev:api` e `npm run dev:web` em dois terminais, ou fazer tudo manualmente.

**Terminal 1: backend**, na raiz do projeto:

```bash
# Crie o venv uma única vez (Windows: python | Linux/macOS: python3)
python -m venv .venv

# Ative o venv:
source .venv/Scripts/activate     # Windows (Git Bash)
.venv\Scripts\Activate.ps1        # Windows (PowerShell)
source .venv/bin/activate         # Linux/macOS

pip install -r requirements.txt
uvicorn app.main:app --reload
```

Se o PowerShell bloquear o `Activate.ps1`, libere scripts só para a sessão atual com `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` e tente de novo.

**Terminal 2: frontend:**

```bash
cd frontend
npm install
npm run dev
```

As URLs são as mesmas da tabela acima.

### Testes do frontend

```bash
cd frontend
npm test
```

### Build de produção do frontend

```bash
cd frontend
npm run build
npm run preview
```

## Endpoints da API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/` | Verificação de disponibilidade |
| GET | `/endereco/{cep}` | Retorna `logradouro`, `bairro`, `cidade`, `estado` e `regiao` |
| GET | `/endereco/{cep}/localizacao` | Retorna `latitude`, `longitude`, `precisao` (`logradouro`, `bairro` ou `cidade`) e `aproximada` |

Erros: `400` (CEP sem 8 dígitos), `404` (CEP ou localização não encontrados), `502` (falha no ViaCEP) e `503` (serviço de mapas indisponível).

Exemplo:

```json
{
  "logradouro": "Avenida Brigadeiro Faria Lima",
  "bairro": "Itaim Bibi",
  "cidade": "São Paulo",
  "estado": "SP",
  "regiao": "Sudeste"
}
```

## Geocodificação e política do Nominatim

O endpoint `/endereco/{cep}/localizacao` usa o [Nominatim](https://nominatim.org/) (OpenStreetMap), sem chave de API, respeitando a [política de uso](https://operations.osmfoundation.org/policies/nominatim/):

- identifica a aplicação com `User-Agent` próprio (configurável pela variável de ambiente `NOMINATIM_USER_AGENT`);
- no máximo 1 requisição por segundo;
- cache em memória (7 dias para endereços localizados, 1 hora para não localizados);
- a geocodificação só ocorre após uma consulta de CEP válida, nunca a cada digitação.

A busca tenta, nesta ordem, logradouro + cidade + estado, bairro + cidade + estado e, por fim, cidade + estado. Como o CEP não informa o número do imóvel, a posição é a do logradouro (sem número exato) ou aproximada. O cache é perdido ao reiniciar o servidor.

## Tecnologias

- **Backend:** Python, FastAPI, Pydantic, HTTPX, Uvicorn, Pytest.
- **Frontend:** React 19, Vite 6, React Leaflet, Lucide React, Vitest, JavaScrip, CSS.
- **Serviços externos:** ViaCEP, OpenStreetMap e Nominatim, Leaflet.

## Limitações

- A geocodificação depende do Nominatim (limite de 1 req/s, cache em memória perdido ao reiniciar). Sem número do imóvel, a posição é a do logradouro ou aproximada (bairro/cidade).
- O ViaCEP e o Nominatim são serviços externos; indisponibilidade resulta em erro 502/503 tratado na interface.
- O `vitest` está fixado na versão `4.1.11` no `package.json`: a 4.1.12 publicou peer dependencies inconsistentes que causam o erro `edgesOut` no npm 10.9.x.
