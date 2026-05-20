import "dotenv/config";
import express, { Express, Request, Response, NextFunction } from "express";
import routes from "./routes/auth.routes";
import { errorHandler } from "./middlewares/erro.middlewares";


// ============================================================
// 1. CONFIGURAÇÃO INICIAL DO EXPRESS
// ============================================================

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware: Permitir requisições JSON e de outros domínios
app.use(express.json());


    app.use((req: Request, res: Response, next: NextFunction) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");

if (req.method === "OPTIONS") {
    return res.sendStatus(200).end();
}
    
    next();
}); 

app.use(express.static("public"));

app.post("/api/test-cors", (req: Request, res: Response) => {
    res.json({ message: "CORS funcionando!" });
});

app.use("/api", routes);

// Middleware de tratamento de erros
app.use(errorHandler);

export default app;
app.listen(PORT, () => {
  console.log("🚀 Servidor rodando em http://localhost:" + PORT);
  console.log("📚 Documentação: http://localhost:" + PORT);
  console.log("💚 Para parar: Ctrl + C");
});
