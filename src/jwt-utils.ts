 import jwt from "jsonwebtoken";

// ============================================================
// TIPOS E INTERFACES
// ============================================================

// Dados que vão DENTRO do token
export interface TokenPayload {
  id: number;           // ID do usuário
  email: string;        // Email do usuário
  nome: string;         // Nome do usuário
}

// Resultado da validação do token
export interface TokenValidado {
  valido: boolean;
  dados?: TokenPayload;
  erro?: string;
}

// ============================================================
// CONFIGURAÇÃO
// ============================================================

// Chave secreta para assinar/validar tokens
// TODO: Mover para variável de ambiente .env
const JWT_SECRET = process.env.JWT_SECRET || "sua_chave_secreta_muito_segura_2026";

// Tempo de expiração do token (24 horas em segundos)
const JWT_EXPIRATION = "24h";

// ============================================================
// FUNÇÃO 1: GERAR TOKEN
// ============================================================

/**
 * Gera um novo JWT token
 * 
 * O que faz:
 * 1. Recebe dados do usuário (id, email, nome)
 * 2. Criptografa os dados
 * 3. Define tempo de expiração (24 horas)
 * 4. Retorna o token como string
 * 
 * @param payload Dados a serem incluídos no token
 * @returns Token JWT assinado
 * 
 * Exemplo:
 * const token = gerarToken({ id: 1, email: "joao@test.com", nome: "João" })
 * // token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 */
export function gerarToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRATION,  // Token expira em 24 horas
    algorithm: "HS256",         // Algoritmo de criptografia
  });
}

// ============================================================
// FUNÇÃO 2: VALIDAR TOKEN
// ============================================================

/**
 * Valida um JWT token
 * 
 * O que faz:
 * 1. Recebe um token como string
 * 2. Tenta descriptografá-lo
 * 3. Se válido: extrai e retorna os dados
 * 4. Se inválido: retorna erro
 * 
 * @param token Token a ser validado
 * @returns Objeto com resultado da validação
 * 
 * Exemplo válido:
 * const resultado = validarToken("eyJhbGciOi...")
 * // resultado = {
 * //   valido: true,
 * //   dados: { id: 1, email: "joao@test.com", nome: "João" }
 * // }
 * 
 * Exemplo inválido:
 * const resultado = validarToken("token_fake")
 * // resultado = {
 * //   valido: false,
 * //   erro: "jwt malformed"
 * // }
 */
export function validarToken(token: string): TokenValidado {
  try {
    // Tenta verificar e descriptografar o token
    const dados = jwt.verify(token, JWT_SECRET) as TokenPayload;
    
    return {
      valido: true,
      dados,
    };
  } catch (erro: any) {
    // Se falhar, retorna erro
    return {
      valido: false,
      erro: erro.message, // "jwt expired", "jwt malformed", etc
    };
  }
}

// ============================================================
// FUNÇÃO 3: EXTRAIR TOKEN DO HEADER (Auxiliar)
// ============================================================

/**
 * Extrai o token do header Authorization
 * 
 * O que faz:
 * O cliente envia o token assim:
 * Authorization: Bearer eyJhbGciOi...
 * 
 * Esta função extrai só a parte "eyJhbGciOi..."
 * 
 * @param authHeader Header Authorization recebido
 * @returns Token extraído ou null se inválido
 * 
 * Exemplo:
 * const token = extrairToken("Bearer eyJhbGciOi...")
 * // token = "eyJhbGciOi..."
 * 
 * const token = extrairToken("eyJhbGciOi...")
 * // token = null (falta "Bearer")
 */
export function extrairToken(authHeader?: string): string | null {
  if (!authHeader) {
    return null;
  }

  // Espera formato: "Bearer <token>"
  const partes = authHeader.split(" ");
  
  if (partes.length !== 2 || partes[0] !== "Bearer") {
    return null;
  }

  return partes[1];
}
