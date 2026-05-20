import { Router } from "express";
import { UserController } from "../controllers/user.controller";   
import { jwtMiddleware } from "../middlewares/jwt.middleware";

const router = Router();
const userController = new UserController();
router.post("/register", userController.register);
router.post("/login", userController.login);
router.use(jwtMiddleware);
router.get("/users", userController.getAllUsers);
router.get("/users/:id", userController.getUserById);
export default router;

export const authRoutes = router;