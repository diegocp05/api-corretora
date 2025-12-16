import fastify from 'fastify';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import cors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import 'dotenv/config';

// Inicializa o Prisma fora para evitar múltiplas conexões em reload
const prisma = new PrismaClient();

async function bootstrap() {
  const app = fastify({ logger: true });

  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'API de Sinistros (Insurtech)',
        description: 'Documentação da API de Seguros',
        version: '1.0.0',
      },
      servers: [{
        url: 'http://localhost:3333',
        description: 'Servidor Local'
      }],
      components: {
        securitySchemes: {
          apiKey: {
            type: 'apiKey',
            name: 'apiKey',
            in: 'header'
          }
        }
      }
    }
  });

  await app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false
    },
  });

 // --- 2. PLUGINS GERAIS ---
  await app.register(cors, { origin: true });
  
  // MUDANÇA AQUI: Adicione { attachFieldsToBody: true }
  await app.register(multipart, { attachFieldsToBody: true });
  
  await app.register(fastifyStatic, {
    root: path.join(__dirname, '../uploads'),
    prefix: '/uploads/',
  });
  // --- 3. ROTAS ---
  
  // Rota: Criar Sinistro
  app.post('/sinistros', {
    schema: {
      description: 'Cria um novo ticket de sinistro',
      tags: ['Sinistros'],
      summary: 'Criar Sinistro',
      body: {
        type: 'object',
        properties: {
          clienteId: { type: 'string' },
          tipo: { type: 'string', enum: ['ROUBO', 'COLISAO', 'GUINCHO', 'TERCEIROS'] },
          descricao: { type: 'string' },
          dataOcorrido: { type: 'string', format: 'date-time' }
        }
      }
    },
  }, async (request, reply) => {
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
  app.get('/sinistros', {
    schema: {
      description: 'Lista todos os sinistros e evidências',
      tags: ['Sinistros'],
      summary: 'Listar Tudo',
    }
  }, async () => {
    return await prisma.sinistro.findMany({
      include: { evidencias: true }
    });
  });

  // Rota: Upload
  app.post('/sinistros/:id/upload', {
    schema: {
      description: 'Envia foto ou documento',
      tags: ['Evidências'],
      summary: 'Upload de Arquivo',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      consumes: ['multipart/form-data'],
      body: {
        type: 'object',
        properties: {
          file: { type: 'string', format: 'binary' }
        }
      }
    },
    
    validatorCompiler: () => {
      return () => true;
    }
  }, async (request, reply) => {
    const paramsSchema = z.object({ id: z.string() });
    const { id } = paramsSchema.parse(request.params);

    // Verificamos se o sinistro existe
    const sinistro = await prisma.sinistro.findUnique({ where: { id } });
    if (!sinistro) return reply.status(404).send({ message: "Sinistro não encontrado" });

    const data = (request.body as any)?.file;

    if (!data) return reply.status(400).send({ message: "Envie uma imagem!" });

    // Prepara o nome e o caminho
    const nomeArquivo = `${Date.now()}-${data.filename}`;
    const pastaUploads = path.resolve(__dirname, '../uploads');
    const caminhoSalvar = path.join(pastaUploads, nomeArquivo);

    // Garante que a pasta existe
    if (!fs.existsSync(pastaUploads)){
        fs.mkdirSync(pastaUploads);
    }

    // Salva o arquivo no disco (converte o Buffer para arquivo real)
    await fs.promises.writeFile(caminhoSalvar, await data.toBuffer());

    const urlDaImagem = `http://localhost:3333/uploads/${nomeArquivo}`;
    
    // Salva no banco
    await prisma.evidencia.create({
      data: {
        sinistroId: id,
        url: urlDaImagem,
        tipoArquivo: data.mimetype
      }
    });

    return reply.status(201).send({ message: "Upload feito!", url: urlDaImagem });
  });

  // Rota: Atualizar Status
  app.patch('/sinistros/:id/status', {
    schema: {
      description: 'Analista atualiza o andamento do processo',
      tags: ['Sinistros'],
      summary: 'Atualizar Status',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      body: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['ABERTO', 'EM_ANALISE', 'APROVADO', 'REJEITADO', 'CONCLUIDO'] }
        }
      }
    }
  }, async (request, reply) => {
    const paramsSchema = z.object({ id: z.string() });
    const { id } = paramsSchema.parse(request.params);

    const bodySchema = z.object({
      status: z.enum(['ABERTO', 'EM_ANALISE', 'APROVADO', 'REJEITADO', 'CONCLUIDO'])
    });
    
    const validacao = bodySchema.safeParse(request.body);

    if (!validacao.success) {
      return reply.status(400).send({ 
        message: "Status inválido.",
        erro: validacao.error.format() 
      });
    }

    const { status } = validacao.data;

    const sinistroExiste = await prisma.sinistro.findUnique({ where: { id } });
    if (!sinistroExiste) {
      return reply.status(404).send({ message: "Sinistro não encontrado." });
    }

    const sinistroAtualizado = await prisma.sinistro.update({
      where: { id },
      data: { status }
    });

    return reply.send({ 
      message: "Status atualizado com sucesso!", 
      novoStatus: sinistroAtualizado.status 
    });
  });

  // --- 4. START ---
  try {
    await prisma.$connect();
    await app.listen({ port: 3333, host: '0.0.0.0' });

    console.log('✅ Servidor rodando em http://localhost:3333');
    console.log('📄 Documentação em http://localhost:3333/docs');
  } catch (err) {
    console.error('Erro ao iniciar:', err);
    process.exit(1);
  }
}

// Executa a função principal
bootstrap();