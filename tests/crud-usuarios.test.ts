import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  criarUsuario,
  listarTodosUsuarios,
  buscarUsuarioPorId,
  buscarUsuarioPorEmail,
  atualizarNomeUsuario,
  alterarSenhaUsuario,
  deletarUsuario,
  autenticarUsuario,
} from '../src/crud-usuarios';

describe('CRUD Usuários', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    // Usar banco de teste
    prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    });

    // Limpar banco antes dos testes
    await prisma.usuario.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Limpar banco antes de cada teste para isolamento
    await prisma.usuario.deleteMany();
  });

  beforeEach(async () => {
    // Limpar dados entre testes
    await prisma.usuario.deleteMany();
  });

  describe('criarUsuario', () => {
    it('deve criar um usuário com sucesso', async () => {
      const usuario = await criarUsuario('João Silva', 'joao@example.com', 'SenhaForte123!');

      expect(usuario).toBeDefined();
      expect(usuario.id).toBeDefined();
      expect(usuario.nome).toBe('João Silva');
      expect(usuario.email).toBe('joao@example.com');
      expect(usuario.senha).not.toBe('SenhaForte123!'); // Senha deve estar hasheada
      expect(usuario.criadoEm).toBeDefined();
      expect(usuario.atualizadoEm).toBeDefined();
    });

    it('deve lançar erro para email duplicado', async () => {
      await criarUsuario('João Silva', 'joao@example.com', 'SenhaForte123!');

      await expect(criarUsuario('Outro João', 'joao@example.com', 'OutraSenha123!')).rejects.toThrow('Email já está em uso');
    });
  });

  describe('listarTodosUsuarios', () => {
    it('deve retornar lista vazia quando não há usuários', async () => {
      const usuarios = await listarTodosUsuarios();
      expect(usuarios).toEqual([]);
    });

    it('deve retornar todos os usuários', async () => {
      const usuario1 = await criarUsuario('João Silva', 'joao@example.com', 'SenhaForte123!');

      const usuario2 = await criarUsuario('Maria Santos', 'maria@example.com', 'SenhaForte456!');

      const usuarios = await listarTodosUsuarios();

      expect(usuarios).toHaveLength(2);
      expect(usuarios).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: usuario1.id, nome: usuario1.nome, email: usuario1.email }),
          expect.objectContaining({ id: usuario2.id, nome: usuario2.nome, email: usuario2.email })
        ])
      );
    });
  });

  describe('buscarUsuarioPorId', () => {
    it('deve retornar usuário quando encontrado', async () => {
      const usuarioCriado = await criarUsuario('João Silva', 'joao@example.com', 'SenhaForte123!');

      const usuario = await buscarUsuarioPorId(usuarioCriado.id);

      expect(usuario).toBeDefined();
      expect(usuario?.id).toBe(usuarioCriado.id);
      expect(usuario?.nome).toBe(usuarioCriado.nome);
      expect(usuario?.email).toBe(usuarioCriado.email);
    });

    it('deve retornar null quando usuário não encontrado', async () => {
      const usuario = await buscarUsuarioPorId(999);
      expect(usuario).toBeNull();
    });
  });

  describe('buscarUsuarioPorEmail', () => {
    it('deve retornar usuário quando encontrado', async () => {
      const usuarioCriado = await criarUsuario('João Silva', 'joao@example.com', 'SenhaForte123!');

      const usuario = await buscarUsuarioPorEmail('joao@example.com');

      expect(usuario).toBeDefined();
      expect(usuario?.id).toBe(usuarioCriado.id);
      expect(usuario?.email).toBe('joao@example.com');
    });

    it('deve retornar null quando email não encontrado', async () => {
      const usuario = await buscarUsuarioPorEmail('naoexiste@example.com');
      expect(usuario).toBeNull();
    });
  });

  describe('atualizarNomeUsuario', () => {
    it('deve atualizar nome do usuário', async () => {
      const usuarioCriado = await criarUsuario('João Silva', 'joao@example.com', 'SenhaForte123!');

      const novoNome = 'João Silva Atualizado';
      const usuarioAtualizado = await atualizarNomeUsuario(usuarioCriado.id, novoNome);

      expect(usuarioAtualizado).toBeDefined();
      expect(usuarioAtualizado?.nome).toBe(novoNome);
      expect(usuarioAtualizado?.email).toBe(usuarioCriado.email);
    });

    it('deve lançar erro para usuário não encontrado', async () => {
      await expect(atualizarNomeUsuario(999, 'Novo Nome')).rejects.toThrow('Usuário não encontrado');
    });
  });

  describe('alterarSenhaUsuario', () => {
    it('deve alterar senha do usuário', async () => {
      const usuarioCriado = await criarUsuario('João Silva', 'joao@example.com', 'SenhaForte123!');

      const novaSenha = 'NovaSenha456!';
      await alterarSenhaUsuario(usuarioCriado.id, novaSenha);

      // Verificar se a nova senha funciona para autenticação
      const usuarioAutenticado = await autenticarUsuario('joao@example.com', novaSenha);
      expect(usuarioAutenticado).toBeDefined();
      expect(usuarioAutenticado?.id).toBe(usuarioCriado.id);
    });

    it('deve lançar erro para usuário não encontrado', async () => {
      await expect(alterarSenhaUsuario(999, 'NovaSenha')).rejects.toThrow('Usuário não encontrado');
    });
  });

  describe('deletarUsuario', () => {
    it('deve deletar usuário com sucesso', async () => {
      const usuarioCriado = await criarUsuario('João Silva', 'joao@example.com', 'SenhaForte123!');

      const resultado = await deletarUsuario(usuarioCriado.id);
      expect(resultado).toBe(true);

      // Verificar se usuário foi removido
      const usuarioBuscado = await buscarUsuarioPorId(usuarioCriado.id);
      expect(usuarioBuscado).toBeNull();
    });

    it('deve lançar erro para usuário não encontrado', async () => {
      await expect(deletarUsuario(999)).rejects.toThrow('Usuário não encontrado');
    });
  });

  describe('autenticarUsuario', () => {
    it('deve autenticar usuário com credenciais corretas', async () => {
      await criarUsuario('João Silva', 'joao@example.com', 'SenhaForte123!');

      const usuarioAutenticado = await autenticarUsuario('joao@example.com', 'SenhaForte123!');

      expect(usuarioAutenticado).toBeDefined();
      expect(usuarioAutenticado?.email).toBe('joao@example.com');
      expect(usuarioAutenticado?.nome).toBe('João Silva');
    });

    it('deve retornar null para email inexistente', async () => {
      const usuarioAutenticado = await autenticarUsuario('naoexiste@example.com', 'senha');
      expect(usuarioAutenticado).toBeNull();
    });

    it('deve retornar null para senha incorreta', async () => {
      await criarUsuario('João Silva', 'joao@example.com', 'SenhaForte123!');

      const usuarioAutenticado = await autenticarUsuario('joao@example.com', 'senhaerrada');
      expect(usuarioAutenticado).toBeNull();
    });
  });
});