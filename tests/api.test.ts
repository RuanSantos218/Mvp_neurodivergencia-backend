import request from 'supertest';
import { criarUsuario } from '../src/crud-usuarios';
import { gerarToken } from '../src/jwt-utils';
import { PrismaClient } from '@prisma/client';

// Importar o app Express
import app from '../src/server';

describe('API Integration Tests', () => {
  let authToken: string;
  let testUser: any;
  let prisma: PrismaClient;

  beforeAll(async () => {
    // Usar banco principal para testes de API
    prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    });

    // Limpar dados específicos dos testes de API
    await prisma.usuario.deleteMany();

    // Criar usuário de teste específico para API
    testUser = await criarUsuario('Test User API', 'testapi@example.com', 'TestPassword123!');

    // Gerar token para autenticação
    authToken = gerarToken({
      id: testUser.id,
      email: testUser.email,
      nome: testUser.nome
    });
  });

  afterAll(async () => {
    // Limpar dados dos testes de API
    await prisma.usuario.deleteMany();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Limpar banco antes de cada teste para isolamento completo
    await prisma.usuario.deleteMany();

    // Recriar usuário de teste para cada teste
    testUser = await criarUsuario('Test User API', 'testapi@example.com', 'TestPassword123!');
    authToken = gerarToken({
      id: testUser.id,
      email: testUser.email,
      nome: testUser.nome
    });
  });

  describe('GET /health', () => {
    it('deve retornar status de saúde do servidor', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        sucesso: true,
        mensagem: 'Servidor está funcionando!'
      });
    });
  });

  describe('POST /api/auth/login', () => {
    it('deve fazer login com sucesso', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testapi@example.com',
          senha: 'TestPassword123!'
        })
        .expect(200);

      expect(response.body.sucesso).toBe(true);
      expect(response.body.mensagem).toBe('Login bem-sucedido');
      expect(response.body.dados).toHaveProperty('token');
      expect(response.body.dados).toHaveProperty('id');
      expect(response.body.dados).toHaveProperty('nome');
      expect(response.body.dados).toHaveProperty('email');
    });

    it('deve retornar erro para credenciais inválidas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testapi@example.com',
          senha: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.sucesso).toBe(false);
      expect(response.body.erro).toBe('Email ou senha incorretos');
    });
  });

  describe('POST /api/usuarios', () => {
    it('deve criar usuário com sucesso', async () => {
      const response = await request(app)
        .post('/api/usuarios')
        .send({
          nome: 'Novo Usuário',
          email: 'novo@example.com',
          senha: 'NovaSenha123!'
        })
        .expect(201);

      expect(response.body.sucesso).toBe(true);
      expect(response.body.dados).toHaveProperty('id');
      expect(response.body.dados.nome).toBe('Novo Usuário');
      expect(response.body.dados.email).toBe('novo@example.com');
    });

    it('deve retornar erro para email já existente', async () => {
      // Primeiro criar um usuário
      await request(app)
        .post('/api/usuarios')
        .send({
          nome: 'Primeiro Usuário',
          email: 'duplicado@example.com',
          senha: 'Senha123!'
        });

      // Tentar criar outro com mesmo email
      const response = await request(app)
        .post('/api/usuarios')
        .send({
          nome: 'Segundo Usuário',
          email: 'duplicado@example.com',
          senha: 'Senha123!'
        })
        .expect(400);

      expect(response.body.sucesso).toBe(false);
      expect(response.body.erro).toBe('Este email já está cadastrado');
    });
  });

  describe('GET /api/usuarios', () => {
    it('deve retornar lista de usuários com autenticação', async () => {
      const response = await request(app)
        .get('/api/usuarios')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.sucesso).toBe(true);
      expect(Array.isArray(response.body.dados)).toBe(true);
      expect(response.body.dados.length).toBeGreaterThan(0);
    });

    it('deve retornar erro sem token de autenticação', async () => {
      const response = await request(app)
        .get('/api/usuarios')
        .expect(401);

      expect(response.body.sucesso).toBe(false);
      expect(response.body.erro).toBe('Token de autorização não fornecido');
    });
  });

  describe('GET /api/usuarios/:id', () => {
    it('deve retornar usuário específico com autenticação', async () => {
      const response = await request(app)
        .get(`/api/usuarios/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.sucesso).toBe(true);
      expect(response.body.dados.id).toBe(testUser.id);
      expect(response.body.dados.email).toBe(testUser.email);
    });

    it('deve retornar erro para usuário não encontrado', async () => {
      const response = await request(app)
        .get('/api/usuarios/999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.sucesso).toBe(false);
      expect(response.body.erro).toBe('Usuário não encontrado');
    });
  });

  describe('PUT /api/usuarios/:id', () => {
    it('deve atualizar nome do usuário', async () => {
      const response = await request(app)
        .put(`/api/usuarios/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nome: 'Nome Atualizado'
        })
        .expect(200);

      expect(response.body.sucesso).toBe(true);
      expect(response.body.dados.nome).toBe('Nome Atualizado');
    });

    it('deve retornar erro para usuário não encontrado', async () => {
      const response = await request(app)
        .put('/api/usuarios/999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nome: 'Nome Atualizado'
        })
        .expect(404);

      expect(response.body.sucesso).toBe(false);
      expect(response.body.erro).toBe('Usuário não encontrado');
    });
  });

  describe('DELETE /api/usuarios/:id', () => {
    it('deve deletar usuário com sucesso', async () => {
      // Criar usuário para deletar
      const userToDelete = await criarUsuario('Usuário Para Deletar', 'delete@example.com', 'Delete123!');

      const response = await request(app)
        .delete(`/api/usuarios/${userToDelete.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.sucesso).toBe(true);
      expect(response.body.mensagem).toBe('Usuário deletado com sucesso');
    });

    it('deve retornar erro para usuário não encontrado', async () => {
      const response = await request(app)
        .delete('/api/usuarios/999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.sucesso).toBe(false);
      expect(response.body.erro).toBe('Usuário não encontrado');
    });
  });
});