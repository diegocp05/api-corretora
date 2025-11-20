import fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const app = fastify();
const prisma = new PrismaClient(); // Inicia a conexão com o banco

// Rota: Criação de Sinistro
app.post('/sinistros', async (request, reply) => {
  
  // 1. Validação dos dados (Schema)
  // Isso garante que ninguém mande dados faltando ou errados
  const criarSinistroSchema = z.object({
    clienteId: z.string(),
    tipo: z.enum(['ROUBO', 'COLISAO', 'GUINCHO', 'TERCEIROS']),
    descricao: z.string(),
    // O Zod valida se é uma data ISO válida (ex: "2023-10-27T10:00:00Z")
    dataOcorrido: z.string().datetime(), 
  });

  // Tenta validar. Se falhar, o Fastify retorna erro 400 automaticamente (se configurado, ou estoura erro)
  const dados = criarSinistroSchema.parse(request.body);

  // 2. Gravação no Banco de Dados
  const sinistro = await prisma.sinistro.create({
    data: {
      clienteId: dados.clienteId,
      tipo: dados.tipo,
      descricao: dados.descricao,
      dataOcorrido: new Date(dados.dataOcorrido), 
      status: 'ABERTO' 
    }
  });

  // 3. Resposta
  return reply.status(201).send({
    message: 'Sinistro registrado com sucesso!',
    sinistroId: sinistro.id,
    status: sinistro.status
  });

});

// Rota de listagem (para conferir se salvou)
app.get('/sinistros', async () => {
  const sinistros = await prisma.sinistro.findMany();
  return sinistros;
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