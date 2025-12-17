<h1 align="center"> Insurtech - API de Sinistros </h1>

<p align="center">
<img src="https://img.shields.io/github/issues/diegocp05/api-corretora"/>
<img src="https://img.shields.io/github/forks/diegocp05/api-corretora"/>
<img src="https://img.shields.io/github/stars/diegocp05/api-corretora"/>
<img src="https://img.shields.io/github/license/diegocp05/api-corretora"/>
</p>

<p align="center">Uma API RESTful robusta e performática desenvolvida para modernizar o setor de seguros automotivos. Com foco na gestão completa do ciclo de vida de um sinistro, a aplicação gerencia desde a abertura do chamado pelo cliente até a análise de evidências (upload de imagens) e aprovação final pelo corretor.</p>

<h1 align="center">
  <img height="400" alt="Dashboard tecnológico de seguros" title="Insurtech API" src="https://cdn.dribbble.com/users/1373613/screenshots/5501306/insurance_dashboard.gif"/>
</h1>

## 🌟 Funcionalidades

### 🚗 Gestão Inteligente de Sinistros
- **Abertura de Chamados**: Registro detalhado de incidentes (Roubo, Colisão, Guincho, Terceiros).
- **Status Dinâmico**: Controle de fluxo de trabalho (Aberto → Em Análise → Aprovado/Rejeitado → Concluído).
- **Validação Rigorosa**: Dados validados com Zod para garantir a integridade do banco de dados.

### 📸 Evidências e Documentação
- **Upload de Arquivos**: Sistema de upload via *Multipart/Form-Data* utilizando Streams para alta performance.
- **Armazenamento Seguro**: Gestão local de arquivos com referências diretas no banco de dados.
- **Associação Automática**: Vínculo inteligente entre a imagem enviada e o ticket do sinistro.

### 📚 Documentação Interativa
- **Swagger UI (OpenAPI 3.0)**: Interface gráfica completa para testar rotas sem necessidade de frontend.
- **Botão de Upload**: Integração nativa no Swagger para envio de arquivos.
- **Schemas Detalhados**: Visualização clara dos dados de entrada e saída.

---

## 📦 URL BASE

🔗 http://localhost:3333

*(Link do Swagger: http://localhost:3333/docs)*

---

## 📋 Rotas da API

### 🏠 Abertura e Listagem

**Criar Novo Sinistro** `POST /sinistros`

**Listar Todos os Sinistros** `GET /sinistros`

---

### 📂 Gestão de Evidências

**Upload de Foto/Documento** `POST /sinistros/:id/upload`

**Exemplo de Uso:**
```javascript
const formData = new FormData();
formData.append('file', arquivoInput.files[0]);

fetch("http://localhost:3333/sinistros/UUID-DO-SINISTRO/upload", {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```
---

### 🔄 Fluxo de Análise

**Atualizar Status do Sinistro** `PATCH /sinistros/:id/status`  
Permite ao analista alterar o status para `EM_ANALISE`, `APROVADO`, `REJEITADO` ou `CONCLUIDO`.

---

### 📄 Formato de Resposta (`GET /sinistros`)

```json
[
  {
    "id": "6b9f3390-6295-4767-8093-855d009cb6f9",
    "clienteId": "diego.costa@email.com",
    "tipo": "COLISAO",
    "status": "ABERTO",
    "descricao": "Bati na traseira de um Honda Civic no semáforo.",
    "dataOcorrido": "2025-12-16T14:30:00.000Z",
    "evidencias": [
      {
        "id": "evidencia-uuid-123",
        "url": "http://localhost:3333/uploads/173450000-foto.png",
        "tipoArquivo": "image/png"
      }
    ]
  }
]
```

---

### 🌟 Exemplos de Uso Completos
```javascript
async function abrirSinistro() {
  try {
    const response = await fetch('http://localhost:3333/sinistros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clienteId: "maria.silva@email.com",
        tipo: "ROUBO",
        descricao: "Levaram meu carro na porta de casa",
        dataOcorrido: new Date().toISOString()
      })
    });
    
    const data = await response.json();
    console.log(`Sinistro criado! ID: ${data.sinistroId}`);
    return data;
  } catch (error) {
    console.error('Erro ao abrir sinistro:', error);
  }
}

// Uso
abrirSinistro();
```

---

### Analisar e Aprovar Sinistro
```javascript
async function aprovarSinistro(idSinistro) {
  try {
    const response = await fetch(`http://localhost:3333/sinistros/${idSinistro}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: "APROVADO" })
    });
    
    const resultado = await response.json();
    console.log(`Novo status: ${resultado.novoStatus}`);
  } catch (error) {
    console.error('Erro na análise:', error);
  }
}

// Uso
aprovarSinistro('uuid-do-sinistro-aqui');
```
---
### 🔧 Tecnologias Utilizadas
- Runtime: Node.js + TypeScript (TSX)
- Framework: Fastify
- Banco de Dados: PostgreSQL (via Docker)
- ORM: Prisma
- Validação: Zod
- Documentação: Swagger (OpenAPI 3.0)
- Uploads: Fastify Multipart + Streams
--- 

##📚 Como Executar Localmente
**Clone o repositório**
```bash
git clone [https://github.com/diegocp05/api-sinistros.git](https://github.com/diegocp05/api-sinistros.git)
cd api-sinistros
```

**Suba o Banco de Dados (Docker)**
```bash
docker-compose up -d
```

**Instale as dependências e configure o Banco**
```bash
npm install
npx prisma generate
npx prisma migrate dev
```

**Inicie o servidor**
```bash
npm run dev
```
**A documentação interativa estará disponível em http://localhost:3333/docs**

## 🚀 Autor
 
<sub>@diegocp05</sub>

<p align="center">
  Feito com ❤️ por <a href="https://github.com/diegocp05">Diego Costa</a>
</p>




