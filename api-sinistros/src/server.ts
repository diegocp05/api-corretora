import fastify from 'fastify';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises'; // Importação simplificada

const app = fastify();
const prisma = new PrismaClient();

// Registrar plugins
app.register(multipart);
app.register(fastifyStatic, {
  root: path.join(__dirname, '../uploads'),
  prefix: '/uploads/',
});

// Rota: Criar Sinistro
app.post('/sinistros', async (request, reply) => {
  const criarSinistroSchema = z.object({
    clienteId: z.string(),
    tipo: z.enum(['ROUBO', 'COLISAO', 'GUINCHO', 'TERCEIROS']),
    descricao: z.string(),
    dataOcorrido: z.string().datetime(), 
  });

  const dados = criarSinistroSchema.parse(request.body);

  const sinistro = await prisma.sinistro.create({
    data: {
      clienteId: dados.clienteId,
      tipo: dados.tipo,
      descricao: dados.descricao,
      dataOcorrido: new Date(dados.dataOcorrido),
      status: 'ABERTO'
    }
  });

  return reply.status(201).send({ message: 'Sinistro criado!', sinistroId: sinistro.id });
});

// Rota: Listar
app.get('/sinistros', async () => {
  return await prisma.sinistro.findMany({
    include: { evidencias: true }
  });
});

// Rota: Upload de Evidência
app.post('/sinistros/:id/upload', async (request, reply) => {
  const paramsSchema = z.object({ id: z.string() });
  const { id } = paramsSchema.parse(request.params);

  const sinistro = await prisma.sinistro.findUnique({ where: { id } });
  if (!sinistro) return reply.status(404).send({ message: "Sinistro não encontrado" });

  const data = await request.file();
  if (!data) return reply.status(400).send({ message: "Envie uma imagem!" });

  const nomeArquivo = `${Date.now()}-${data.filename}`;
  
  const pastaUploads = path.resolve(__dirname, '../uploads');
  const caminhoSalvar = path.join(pastaUploads, nomeArquivo);

  if (!fs.existsSync(pastaUploads)){
      fs.mkdirSync(pastaUploads);
  }

  await pipeline(data.file, fs.createWriteStream(caminhoSalvar));

  const urlDaImagem = `http://localhost:3333/uploads/${nomeArquivo}`;
  
  await prisma.evidencia.create({
    data: {
      sinistroId: id,
      url: urlDaImagem,
      tipoArquivo: data.mimetype
    }
  });

  return reply.status(201).send({ message: "Upload feito!", url: urlDaImagem });
});

app.patch('/sinistros/:id/status', async (request, reply) => {
  const paramsSchema = z.object({ id: z.string() });
  const { id } = paramsSchema.parse(request.params);

  const bodySchema = z.object({
    status: z.enum(['ABERTO', 'EM_ANALISE', 'APROVADO', 'REJEITADO', 'CONCLUIDO'])
  });
  
  const validacao = bodySchema.safeParse(request.body);

  if (!validacao.success) {
    return reply.status(400).send({ 
      message: "Status inválido. Use apenas: ABERTO, EM_ANALISE, APROVADO, REJEITADO, CONCLUIDO",
      erro: validacao.error.format() 
    });
  }

  const { status } = validacao.data;

  // 3. Verificar se o sinistro existe
  const sinistroExiste = await prisma.sinistro.findUnique({ where: { id } });
  if (!sinistroExiste) {
    return reply.status(404).send({ message: "Sinistro não encontrado." });
  }

  // 4. Atualizar no Banco
  const sinistroAtualizado = await prisma.sinistro.update({
    where: { id },
    data: { status }
  });

  return reply.send({ 
    message: "Status atualizado com sucesso!", 
    novoStatus: sinistroAtualizado.status 
  });
});

const start = async () => {
  try {
    await app.listen({ port: 3333 });
    console.log('✅ Servidor rodando em http://localhost:3333');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();