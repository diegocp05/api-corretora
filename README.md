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

