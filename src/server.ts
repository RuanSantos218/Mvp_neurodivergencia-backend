import "dotenv/config";
import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import routes from "./routes/auth.routes";
import { errorHandler } from "./middlewares/erro.middlewares";

// ============================================================
// 1. CONFIGURAÇÃO INICIAL DO EXPRESS
// ============================================================

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware: Permitir requisições JSON e de outros domínios
app.use(express.json());
app.use(cors());

app.use("/api", routes);

// Middleware de tratamento de erros
app.use(errorHandler);

export default app;
app.listen(PORT, () => {
  console.log("🚀 Servidor rodando em http://localhost:" + PORT);
  console.log("📚 Documentação: http://localhost:" + PORT);
  console.log("💚 Para parar: Ctrl + C");
});
