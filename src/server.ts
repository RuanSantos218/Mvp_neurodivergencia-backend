import "dotenv/config";
import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import { gerarToken, validarToken, extrairToken, TokenPayload } from "./jwt-utils";
import {
  criarUsuario,
  listarTodosUsuarios,
  buscarUsuarioPorId,
  buscarUsuarioPorEmail,
  atualizarNomeUsuario,
  atualizarEmailUsuario,
  alterarSenhaUsuario,
  deletarUsuario,
  autenticarUsuario,
} from "./crud-usuarios";

// ============================================================
// 1. CONFIGURAÇÃO INICIAL DO EXPRESS
// ============================================================

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware: Permitir requisições JSON e de outros domínios
app.use(express.json());
app.use(cors());

// ============================================================
// 2. TIPOS E INTERFACES
// ============================================================

// Define o formato padrão de resposta da API
interface ApiResponse<T> {
  sucesso: boolean;
  mensagem?: string;
  dados?: T;
  erro?: string;
}

// Define o formato de erro esperado
interface ErroValidacao {
  campo: string;
  mensagem: string;
}

interface RequestWithUsuario extends Request {
  usuario?: TokenPayload;
}

// ============================================================
// 3. FUNÇÕES AUXILIARES
// ============================================================

// Validar email com regex
function validarEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Validar força de senha (mínimo 6 caracteres)
function validarSenha(senha: string): { valida: boolean; mensagem?: string } {
  if (senha.length < 6) {
    return { valida: false, mensagem: "Senha deve ter mínimo 6 caracteres" };
  }
  return { valida: true };
}

// ============================================================
// 4. MIDDLEWARE DE AUTENTICAÇÃO JWT
// ============================================================

function autenticarMiddleware(
  req: RequestWithUsuario,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization as string | undefined;
  const token = extrairToken(authHeader);

  if (!token) {
    return res.status(401).json({
      sucesso: false,
      erro: "Token de autorização não fornecido",
    } as ApiResponse<null>);
  }

  const resultado = validarToken(token);
  if (!resultado.valido || !resultado.dados) {
    return res.status(401).json({
      sucesso: false,
      erro: resultado.erro || "Token inválido",
    } as ApiResponse<null>);
  }

  req.usuario = resultado.dados;
  next();
}

// ============================================================
// 5. MIDDLEWARE DE TRATAMENTO DE ERROS
// ============================================================

// Middleware para capturar erros não tratados
const tratarErro = (
  erro: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("❌ Erro capturado:", erro.message);

  // Se for erro de email duplicado (Prisma ou customizado)
  if (
    (erro.code === "P2002" && erro.meta?.target?.includes("email")) ||
    erro.message === "Email já está em uso"
  ) {
    return res.status(400).json({
      sucesso: false,
      erro: "Este email já está cadastrado",
    } as ApiResponse<null>);
  }

  // Se for erro de registro não encontrado
  if (erro.code === "P2025") {
    return res.status(404).json({
      sucesso: false,
      erro: "Usuário não encontrado",
    } as ApiResponse<null>);
  }

  // Erro genérico
  res.status(500).json({
    sucesso: false,
    erro: erro.message || "Erro interno do servidor",
  } as ApiResponse<null>);
};

// ============================================================
// 5. ROTAS - CREATE (POST)
// ============================================================

// POST /api/usuarios - Criar novo usuário
app.post("/api/usuarios", async (req: Request, res: Response) => {
  try {
    const { nome, email, senha } = req.body;

    // Validação: verificar campos obrigatórios
    if (!nome || !email || !senha) {
      return res.status(400).json({
        sucesso: false,
        erro: "Nome, email e senha são obrigatórios",
      } as ApiResponse<null>);
    }

    // Validação: email válido
    if (!validarEmail(email)) {
      return res.status(400).json({
        sucesso: false,
        erro: "Email inválido",
      } as ApiResponse<null>);
    }

    // Validação: senha forte
    const validacaoSenha = validarSenha(senha);
    if (!validacaoSenha.valida) {
      return res.status(400).json({
        sucesso: false,
        erro: validacaoSenha.mensagem,
      } as ApiResponse<null>);
    }

    // Criar usuário no banco
    const usuario = await criarUsuario(nome, email, senha);

    return res.status(201).json({
      sucesso: true,
      mensagem: "Usuário criado com sucesso",
      dados: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        criadoEm: usuario.criadoEm,
      },
    } as ApiResponse<any>);
  } catch (erro) {
    tratarErro(erro, req, res, () => {});
  }
});

// Protege todas as rotas de usuário seguintes com JWT
app.use("/api/usuarios", autenticarMiddleware);

// ============================================================
// 6. ROTAS - READ (GET)
// ============================================================

// GET /api/usuarios - Listar todos os usuários
app.get("/api/usuarios", async (req: Request, res: Response) => {
  try {
    const usuarios = await listarTodosUsuarios();

    return res.status(200).json({
      sucesso: true,
      mensagem: `${usuarios.length} usuário(s) encontrado(s)`,
      dados: usuarios,
    } as ApiResponse<any>);
  } catch (erro) {
    tratarErro(erro, req, res, () => {});
  }
});

// GET /api/usuarios/:id - Buscar usuário por ID
app.get("/api/usuarios/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validação: ID deve ser número
    if (isNaN(Number(id))) {
      return res.status(400).json({
        sucesso: false,
        erro: "ID deve ser um número",
      } as ApiResponse<null>);
    }

    const usuario = await buscarUsuarioPorId(Number(id));

    if (!usuario) {
      return res.status(404).json({
        sucesso: false,
        erro: "Usuário não encontrado",
      } as ApiResponse<null>);
    }

    return res.status(200).json({
      sucesso: true,
      dados: usuario,
    } as ApiResponse<any>);
  } catch (erro) {
    tratarErro(erro, req, res, () => {});
  }
});

// GET /api/usuarios/email/:email - Buscar usuário por email
app.get("/api/usuarios/email/:email", async (req: Request, res: Response) => {
  try {
    const email = (req.params.email as string) || "";

    const usuario = await buscarUsuarioPorEmail(email);

    if (!usuario) {
      return res.status(404).json({
        sucesso: false,
        erro: "Usuário não encontrado",
      } as ApiResponse<null>);
    }

    return res.status(200).json({
      sucesso: true,
      dados: usuario,
    } as ApiResponse<any>);
  } catch (erro) {
    tratarErro(erro, req, res, () => {});
  }
});

// ============================================================
// 7. ROTAS - UPDATE (PUT)
// ============================================================

// PUT /api/usuarios/:id - Atualizar dados do usuário
app.put("/api/usuarios/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, email, senha } = req.body;

    // Validação: ID deve ser número
    if (isNaN(Number(id))) {
      return res.status(400).json({
        sucesso: false,
        erro: "ID deve ser um número",
      } as ApiResponse<null>);
    }

    // Verificar se usuário existe
    const usuarioExiste = await buscarUsuarioPorId(Number(id));
    if (!usuarioExiste) {
      return res.status(404).json({
        sucesso: false,
        erro: "Usuário não encontrado",
      } as ApiResponse<null>);
    }

    // Atualizar cada campo se fornecido
    if (nome) {
      await atualizarNomeUsuario(Number(id), nome);
    }

    if (email) {
      if (!validarEmail(email)) {
        return res.status(400).json({
          sucesso: false,
          erro: "Email inválido",
        } as ApiResponse<null>);
      }
      await atualizarEmailUsuario(Number(id), email);
    }

    if (senha) {
      const validacaoSenha = validarSenha(senha);
      if (!validacaoSenha.valida) {
        return res.status(400).json({
          sucesso: false,
          erro: validacaoSenha.mensagem,
        } as ApiResponse<null>);
      }
      await alterarSenhaUsuario(Number(id), senha);
    }

    // Buscar usuário atualizado completo
    const usuarioAtualizado = await buscarUsuarioPorId(Number(id));

    return res.status(200).json({
      sucesso: true,
      mensagem: "Usuário atualizado com sucesso",
      dados: usuarioAtualizado,
    } as ApiResponse<any>);
  } catch (erro) {
    tratarErro(erro, req, res, () => {});
  }
});

// ============================================================
// 8. ROTAS - DELETE
// ============================================================

// DELETE /api/usuarios/:id - Deletar usuário
app.delete("/api/usuarios/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validação: ID deve ser número
    if (isNaN(Number(id))) {
      return res.status(400).json({
        sucesso: false,
        erro: "ID deve ser um número",
      } as ApiResponse<null>);
    }

    // Verificar se usuário existe antes de deletar
    const usuarioExiste = await buscarUsuarioPorId(Number(id));
    if (!usuarioExiste) {
      return res.status(404).json({
        sucesso: false,
        erro: "Usuário não encontrado",
      } as ApiResponse<null>);
    }

    const deletado = await deletarUsuario(Number(id));

    if (deletado) {
      return res.status(200).json({
        sucesso: true,
        mensagem: "Usuário deletado com sucesso",
      } as ApiResponse<null>);
    } else {
      return res.status(500).json({
        sucesso: false,
        erro: "Erro ao deletar usuário",
      } as ApiResponse<null>);
    }
  } catch (erro) {
    tratarErro(erro, req, res, () => {});
  }
});

// ============================================================
// 9. ROTA - AUTENTICAÇÃO (POST)
// ============================================================

// POST /api/auth/login - Autenticar usuário
app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body;

    // Validação: campos obrigatórios
    if (!email || !senha) {
      return res.status(400).json({
        sucesso: false,
        erro: "Email e senha são obrigatórios",
      } as ApiResponse<null>);
    }

    // Validar email e senha
    const usuarioAutenticado = await autenticarUsuario(email, senha);

    if (!usuarioAutenticado) {
      return res.status(401).json({
        sucesso: false,
        erro: "Email ou senha incorretos",
      } as ApiResponse<null>);
    }

    const token = gerarToken({
      id: usuarioAutenticado.id,
      email: usuarioAutenticado.email,
      nome: usuarioAutenticado.nome,
    });

    return res.status(200).json({
      sucesso: true,
      mensagem: "Login bem-sucedido",
      dados: {
        id: usuarioAutenticado.id,
        nome: usuarioAutenticado.nome,
        email: usuarioAutenticado.email,
        token,
      },
    } as ApiResponse<any>);
  } catch (erro) {
    tratarErro(erro, req, res, () => {});
  }
});

// ============================================================
// 10. ROTA - HEALTH CHECK
// ============================================================

// GET /health - Verificar se servidor está rodando
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    sucesso: true,
    mensagem: "Servidor está funcionando!",
  } as ApiResponse<null>);
});

// ============================================================
// 11. ROTA - PÁGINA INICIAL
// ============================================================

// GET / - Informações sobre a API
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    sucesso: true,
    mensagem: "API de Usuários - Banco de Dados PostgreSQL",
    versao: "1.0.0",
    endpoints: {
      usuarios: {
        criar: "POST /api/usuarios",
        listarTodos: "GET /api/usuarios",
        buscarPorId: "GET /api/usuarios/:id",
        buscarPorEmail: "GET /api/usuarios/email/:email",
        atualizar: "PUT /api/usuarios/:id",
        deletar: "DELETE /api/usuarios/:id",
      },
      autenticacao: {
        login: "POST /api/auth/login",
      },
      saude: "GET /health",
    },
  });
});

// ============================================================
// 12. INICIAR SERVIDOR
// ============================================================

// Exportar app para testes
export default app;

app.listen(PORT, () => {
  console.log("🚀 Servidor rodando em http://localhost:" + PORT);
  console.log("📚 Documentação: http://localhost:" + PORT);
  console.log("💚 Para parar: Ctrl + C");
});
