import bcrypt from "bcryptjs";
import { prisma} from "../prisma/database"

export async function createUser(name: string, email: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
    return await prisma.usuario.create({
        data: {
            nome: name,
            email: email,
            senha: hashedPassword,
        },
    });
} catch (erro: any) {

        if (erro.code === "P2002") {
            console.error("❌ Erro: Email já existe no banco de dados.");
            // IMPORTANTE: Avisa o controlador que o e-mail está duplicado 🛡️
            throw new Error("Email já está em uso"); 
        } else {
            console.error("❌ Erro ao criar usuário:", erro.message || erro);
            throw erro;
        }
    }
}

export async function getAllUsers() {

    return prisma.usuario.findMany({
        select: {
            id: true,
            nome: true,
            email: true,
            criadoEm: true,
        }
    });
}

export async function getUserById(id: number) {
    return prisma.usuario.findUnique({
        where: { id },
        select: {
            id: true,
            nome: true,
            email: true,
            criadoEm: true,
        }
    });
} 

export async function GetUserEmail(email:string) {
    return prisma.usuario.findUnique({
        where: { email },
        
     });
}

export async function updateUser(id: number, name?: string, email?: string,) {
    try {
        return await prisma.usuario.update({
            where: { id },
            data: {
                nome: name,
                email: email,
            },
            select: {
                id: true,
                nome: true,
                email: true,
                criadoEm: true,            
            }
        });
    } catch (erro: any) {
        if (erro.code === "P2002") {
            console.error("❌ Erro: Email já existe no banco de dados.");
            throw new Error("Email já está em uso"); 
        } else {
            console.error("❌ Erro ao atualizar usuário:", erro.message || erro);
            throw erro;
        }

    }
}

export async function deleteUser(id: number) {
  try {
    await prisma.usuario.delete({
        where: { id },
    });
    return true;
  } catch (erro: any) {
    if (erro.code === "P2025") {
        console.error("❌ Erro: Usuário não encontrado para exclusão.");
        throw new Error("Usuário não encontrado"); 
    } else {
        console.error("❌ Erro ao excluir usuário:", erro.message || erro);
        throw erro;
    }
  }
}

export async function authenticateUser(email: string, password: string) {
    const user = await GetUserEmail(email);
    if (!user) {
        return null;
    }
    const isPasswordValid = await bcrypt.compare(password, user.senha);
    return isPasswordValid ? user : null;
}


    
  

      

  
