import bcrypt from "bcryptjs";
import { prisma } from "./database";

/**
 * CREATE - Criar novo usuário
 */
async function criarUsuario(nome: string, email: string, senha: string) {
  const senhaHash = await bcrypt.hash(senha, 10);

  try {
    return await prisma.usuario.create({
      data: {
        nome,
        email,
        senha: senhaHash,
      },
    });
  } catch (erro: any) {
    // Se for erro de email duplicado
    if (erro.code === "P2002" && erro.meta?.target?.includes("email")) {
      throw new Error("Email já está em uso");
    }
    throw erro; // Relançar outros erros
  }
}

/**
 * READ - Buscar todos os usuários
 */
async function listarTodosUsuarios() {
  return prisma.usuario.findMany({
    select: {
      id: true,
      nome: true,
      email: true,
      criadoEm: true,
      atualizadoEm: true,
    },
  });
}

/**
 * READ - Buscar usuário por ID
 */
async function buscarUsuarioPorId(id: number) {
  return prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      email: true,
      criadoEm: true,
      atualizadoEm: true,
    },
  });
}

/**
 * READ - Buscar usuário por email
 */
async function buscarUsuarioPorEmail(email: string) {
  return prisma.usuario.findUnique({
    where: { email },
    select: {
      id: true,
      nome: true,
      email: true,
      criadoEm: true,
      atualizadoEm: true,
    },
  });
}

/**
 * UPDATE - Atualizar nome do usuário
 */
async function atualizarNomeUsuario(id: number, novoNome: string) {
  try {
    return await prisma.usuario.update({
      where: { id },
      data: {
        nome: novoNome,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        atualizadoEm: true,
      },
    });
  } catch (erro: any) {
    if (erro.code === "P2025") {
      throw new Error("Usuário não encontrado");
    }
    throw erro;
  }
}

/**
 * UPDATE - Atualizar email do usuário
 */
async function atualizarEmailUsuario(id: number, novoEmail: string) {
  return prisma.usuario.update({
    where: { id },
    data: {
      email: novoEmail,
    },
    select: {
      id: true,
      nome: true,
      email: true,
      atualizadoEm: true,
    },
  });
}

/**
 * UPDATE - Alterar senha do usuário
 */
async function alterarSenhaUsuario(id: number, novaSenha: string) {
  const senhaHash = await bcrypt.hash(novaSenha, 10);

  try {
    return await prisma.usuario.update({
      where: { id },
      data: {
        senha: senhaHash,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        atualizadoEm: true,
      },
    });
  } catch (erro: any) {
    if (erro.code === "P2025") {
      throw new Error("Usuário não encontrado");
    }
    throw erro;
  }
}

/**
 * DELETE - Deletar usuário por ID
 */
async function deletarUsuario(id: number) {
  try {
    await prisma.usuario.delete({
      where: { id },
    });
    return true;
  } catch (erro: any) {
    if (erro.code === "P2025") {
      throw new Error("Usuário não encontrado");
    }
    throw erro;
  }
}

/**
 * AUTENTICAÇÃO - Validar email e senha
 */
async function autenticarUsuario(email: string, senha: string) {
  const usuario = await prisma.usuario.findUnique({
    where: { email },
  });

  if (!usuario) {
    return null;
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senha);
  return senhaValida ? usuario : null;
}

/**
 * Exemplo de uso completo do CRUD
 */
async function exemploUsoCRUD() {
  try {
    console.log("=".repeat(60));
    console.log("EXEMPLO COMPLETO DE CRUD DE USUÁRIOS");
    console.log("=".repeat(60));

    // CREATE - Criar usuários
    console.log("\n1️⃣  CREATE - Criando usuários...");
    const email1 = `usuario${Date.now()}@example.com`;
    const email2 = `usuario${Date.now() + 1}@example.com`;

    const usuario1 = await criarUsuario("João Silva", email1, "Senha123!");
    console.log("✅ Usuário 1 criado:", {
      id: usuario1.id,
      nome: usuario1.nome,
      email: usuario1.email,
    });

    const usuario2 = await criarUsuario("Ana Santos", email2, "Senha456!");
    console.log("✅ Usuário 2 criado:", {
      id: usuario2.id,
      nome: usuario2.nome,
      email: usuario2.email,
    });

    // READ - Listar todos
    console.log("\n2️⃣  READ - Listando todos os usuários...");
    const todosUsuarios = await listarTodosUsuarios();
    console.log(`✅ Total de ${todosUsuarios.length} usuário(s):`);
    todosUsuarios.forEach((u) =>
      console.log(`   - ID: ${u.id} | ${u.nome} <${u.email}>`)
    );

    // READ - Buscar por ID
    console.log("\n3️⃣  READ - Buscando usuário por ID...");
    const usuarioPorId = await buscarUsuarioPorId(usuario1.id);
    console.log("✅ Usuário encontrado:", usuarioPorId);

    // READ - Buscar por email
    console.log("\n4️⃣  READ - Buscando usuário por email...");
    const usuarioPorEmail = await buscarUsuarioPorEmail(email2);
    console.log("✅ Usuário encontrado:", usuarioPorEmail);

    // UPDATE - Atualizar nome
    console.log("\n5️⃣  UPDATE - Alterando nome do usuário...");
    const usuarioComNomeAtualizado = await atualizarNomeUsuario(
      usuario1.id,
      "João Silva Atualizado"
    );
    console.log("✅ Nome atualizado:", usuarioComNomeAtualizado);

    // UPDATE - Atualizar email
    console.log("\n6️⃣  UPDATE - Alterando email do usuário...");
    const novoEmail = `novoemail${Date.now()}@example.com`;
    const usuarioComEmailAtualizado = await atualizarEmailUsuario(
      usuario2.id,
      novoEmail
    );
    console.log("✅ Email atualizado:", usuarioComEmailAtualizado);

    // UPDATE - Alterar senha
    console.log("\n7️⃣  UPDATE - Alterando senha do usuário...");
    const usuarioComSenhaAtualizada = await alterarSenhaUsuario(
      usuario1.id,
      "NovaSenha999!"
    );
    console.log("✅ Senha alterada para o usuário:", usuarioComSenhaAtualizada);

    // AUTENTICAÇÃO - Testar autenticação com nova senha
    console.log("\n8️⃣  AUTENTICAÇÃO - Testando nova senha...");
    const usuarioAutenticado = await autenticarUsuario(
      email1,
      "NovaSenha999!"
    );
    if (usuarioAutenticado) {
      console.log("✅ Autenticação bem-sucedida com a nova senha!");
    } else {
      console.log("❌ Falha na autenticação.");
    }

    // DELETE - Deletar usuário
    console.log("\n9️⃣  DELETE - Deletando usuário...");
    const usuarioDeletado = await deletarUsuario(usuario2.id);
    console.log("✅ Usuário deletado:", usuarioDeletado);

    // READ - Listar após deletar
    console.log("\n🔟 READ - Listando usuários após delete...");
    const usuariosRestantes = await listarTodosUsuarios();
    console.log(`✅ Total de ${usuariosRestantes.length} usuário(s) restante(s):`);
    usuariosRestantes.forEach((u) =>
      console.log(`   - ID: ${u.id} | ${u.nome} <${u.email}>`)
    );

    console.log("\n" + "=".repeat(60));
    console.log("✨ CRUD COMPLETO FUNCIONANDO COM SUCESSO!");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Para executar o exemplo, descomente a linha abaixo:
// exemploUsoCRUD();

// Exportar funções para uso em outros módulos
export {
  criarUsuario,
  listarTodosUsuarios,
  buscarUsuarioPorId,
  buscarUsuarioPorEmail,
  atualizarNomeUsuario,
  atualizarEmailUsuario,
  alterarSenhaUsuario,
  deletarUsuario,
  autenticarUsuario,
};
