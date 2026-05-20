import jwt from 'jsonwebtoken';
import { gerarToken, validarToken, extrairToken } from '../src/utils/jwt-utils';

describe('JWT Utils', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    nome: 'Test User'
  };

  describe('gerarToken', () => {
    it('deve gerar um token JWT válido', () => {
      const token = gerarToken(mockUser);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT tem 3 partes separadas por .
    });
  });

  describe('validarToken', () => {
    it('deve validar um token JWT válido', () => {
      const token = gerarToken(mockUser);
      const resultado = validarToken(token);

      expect(resultado.valido).toBe(true);
      expect(resultado.dados?.id).toBe(mockUser.id);
      expect(resultado.dados?.email).toBe(mockUser.email);
      expect(resultado.dados?.nome).toBe(mockUser.nome);
    });

    it('deve retornar erro para token inválido', () => {
      const invalidToken = 'invalid.jwt.token';
      const resultado = validarToken(invalidToken);

      expect(resultado.valido).toBe(false);
      expect(resultado.erro).toBeDefined();
    });

    it('deve retornar erro para token expirado', () => {
      // Para testar expiração, vamos criar um token que já expirou
      const expiredToken = jwt.sign(mockUser, process.env.JWT_SECRET || 'test_jwt_secret', {
        expiresIn: '-1h' // Já expirou 1 hora atrás
      });
      const resultado = validarToken(expiredToken);

      expect(resultado.valido).toBe(false);
      // Pode ser "jwt expired" ou outro erro relacionado
      expect(resultado.erro).toBeDefined();
    });
  });

  describe('extrairToken', () => {
    it('deve extrair token do header Authorization', () => {
      const token = gerarToken(mockUser);
      const authHeader = `Bearer ${token}`;

      const extractedToken = extrairToken(authHeader);
      expect(extractedToken).toBe(token);
    });

    it('deve retornar null se não houver header Authorization', () => {
      const extractedToken = extrairToken(undefined);
      expect(extractedToken).toBeNull();
    });

    it('deve retornar null se o header não começar com Bearer', () => {
      const extractedToken = extrairToken('Basic someToken');
      expect(extractedToken).toBeNull();
    });
  });
});