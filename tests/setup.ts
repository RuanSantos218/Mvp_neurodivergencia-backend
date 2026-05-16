import { PrismaClient } from '@prisma/client';

// Configuração global para testes
beforeAll(async () => {
  // Configurar variáveis de ambiente para testes
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5433/test_db';
  process.env.JWT_SECRET = 'test_jwt_secret';

  // Limpar banco antes de todos os testes
  const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
  });

  try {
    await prisma.$connect();
    await prisma.usuario.deleteMany();
  } catch (error) {
    console.warn('Erro ao conectar com banco de teste:', error);
  } finally {
    await prisma.$disconnect();
  }
});

afterAll(async () => {
  // Limpeza global se necessário
});