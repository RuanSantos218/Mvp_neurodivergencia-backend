# 🧪 Testes Automatizados

Este projeto inclui uma suíte completa de testes automatizados usando **Jest** e **Supertest**.

## 📋 Tipos de Testes

### 1. **Testes Unitários** (`tests/jwt-utils.test.ts`)
- Testam funções utilitárias JWT
- Geração, validação e extração de tokens
- Cenários de sucesso e erro

### 2. **Testes de Integração** (`tests/crud-usuarios.test.ts`)
- Testam operações CRUD de usuários
- Interação direta com o banco de dados
- Validações de negócio

### 3. **Testes de API** (`tests/api.test.ts`)
- Testam endpoints HTTP da API REST
- Autenticação JWT
- Requisições e respostas completas

## 🚀 Como Executar os Testes

### Pré-requisitos
1. **Docker** instalado
2. **Node.js** e **npm** instalados

### Passos para executar:

```bash
# 1. Iniciar banco de dados de teste
npm run test:setup

# 2. Executar todos os testes
npm test

# 3. Executar testes em modo watch (desenvolvimento)
npm run test:watch

# 4. Executar testes com cobertura
npm run test:coverage

# 5. Limpar banco de teste (opcional)
npm run test:teardown
```

## 📊 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm test` | Executa todos os testes |
| `npm run test:watch` | Executa testes em modo watch |
| `npm run test:coverage` | Executa testes com relatório de cobertura |
| `npm run test:setup` | Inicia banco de teste e roda migrações |
| `npm run test:teardown` | Para e remove container de teste |

## 🏗️ Estrutura dos Testes

```
tests/
├── setup.ts              # Configuração global dos testes
├── jwt-utils.test.ts     # Testes unitários JWT
├── crud-usuarios.test.ts # Testes de integração CRUD
└── api.test.ts          # Testes de API (end-to-end)
```

## ✅ Cenários Testados

### JWT Utils
- ✅ Geração de tokens válidos
- ✅ Validação de tokens
- ✅ Extração de tokens do header
- ✅ Tratamento de tokens inválidos/expirados

### CRUD Usuários
- ✅ Criar usuário (sucesso e duplicado)
- ✅ Listar todos os usuários
- ✅ Buscar por ID e email
- ✅ Atualizar nome e senha
- ✅ Deletar usuário
- ✅ Autenticação de usuário

### API Endpoints
- ✅ `GET /health` - Status do servidor
- ✅ `POST /api/auth/login` - Login
- ✅ `POST /api/usuarios` - Criar usuário
- ✅ `GET /api/usuarios` - Listar usuários (protegido)
- ✅ `GET /api/usuarios/:id` - Buscar usuário (protegido)
- ✅ `PUT /api/usuarios/:id` - Atualizar usuário (protegido)
- ✅ `DELETE /api/usuarios/:id` - Deletar usuário (protegido)

## 🔒 Segurança dos Testes

- **Banco isolado**: Usa banco PostgreSQL separado na porta 5433
- **Dados limpos**: Cada teste começa com banco vazio
- **JWT seguro**: Chaves de teste separadas
- **Setup automático**: Docker Compose configura ambiente de teste

## 📈 Cobertura de Código

Os testes cobrem:
- ✅ Funções utilitárias (100%)
- ✅ Lógica de negócio (CRUD)
- ✅ Endpoints da API
- ✅ Middleware de autenticação
- ✅ Tratamento de erros
- ✅ Validações de entrada

## 🐛 Debugging

Se os testes falharem:

1. **Verifique se o Docker está rodando**
2. **Confirme que a porta 5433 está livre**
3. **Execute `npm run test:setup` primeiro**
4. **Verifique logs do container**: `docker logs postgres_db_test`

## 🎯 Benefícios dos Testes

- **Confiabilidade**: Garante que mudanças não quebram funcionalidades
- **Documentação**: Exemplos de como usar a API
- **Refatoração segura**: Permite mudanças no código com confiança
- **CI/CD**: Base para integração contínua
- **Qualidade**: Reduz bugs em produção