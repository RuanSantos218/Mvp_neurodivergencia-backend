import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/express.type";
import { generateToken, JwtPayload } from "../utils/jwt-utils";
import { 
    createUser,
    getAllUsers,
    getUserById, 
    authenticateUser,
} from "../crud-usuarios"

function validarEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validarSenha(senha: string): boolean {
    return !!senha && senha.length >= 6;
}

export class UserController {

    async register(req: Request, res: Response, next: NextFunction) {
        try {
            const { nome, email, senha } = req.body;
            if (!validarEmail(email)) {
                return res.status(400).json({ message: "Invalid email format" });
            }
            if (!validarSenha(senha)) {
                return res.status(400).json({ message: "Invalid password format" });
            }
            const newUser = await createUser(nome, email, senha);
            const {senha: _, ...userWithoutPassword} = newUser;
            res.status(201).json(userWithoutPassword);
        } catch (error) {
            next(error);
        }
    }
    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, senha } = req.body;
            const user = await authenticateUser(email, senha);
            if (!user) {
                return res.status(401).json({ message: "Invalid email or password" });
            }
            const payload: JwtPayload = {
                userId: user.id,
                email: user.email,
                name: (user as any).nome,
            };
            const token = generateToken(payload);
            res.json({ token });
        } catch (error) {
            next(error);
        }   
    }

    async getAllUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const users = await getAllUsers();
            res.json(users);
        } catch (error) {
            next(error);
        }
    }
    async getUserById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const userId = parseInt(String(req.params.id), 10);
            const user = await getUserById(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            res.json(user);
        } catch (error) {
            next(error);
        }
    }
}
