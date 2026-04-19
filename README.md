# 🌐 Projeto AWS – API Gateway (Exposição de APIs)

## 📌 Sobre o Projeto

Nesta etapa do projeto, foi realizada a implementação do **Amazon API Gateway**, responsável por expor as funções criadas no AWS Lambda como APIs HTTP acessíveis externamente 🌍

O objetivo é permitir que o frontend hospedado no S3 consuma dados dinâmicos através de endpoints seguros e escaláveis 🚀

---

## 🚀 Evolução do Projeto

Esse projeto continua crescendo com foco em um ambiente completo, utilizando serviços como:

✔️ **Amazon S3** – Hospedagem do site estático  
✔️ **Amazon CloudFront** – Distribuição CDN + OAC 🔒  
✔️ **Amazon Route 53** – Gerenciamento de domínio  
✔️ **AWS Certificate Manager** – HTTPS 🔐  

✔️ **AWS Lambda** – Backend serverless  
➡️ **Amazon API Gateway** – Exposição das APIs *(etapa atual)*  
➡️ **Amazon DynamoDB** – Banco de dados *(próxima etapa)*  

---

## 🎯 Objetivos

- Expor funções Lambda como APIs HTTP 🌐  
- Integrar frontend com backend serverless  
- Criar rotas organizadas por funcionalidade  
- Garantir segurança com CORS  
- Preparar ambiente para escalabilidade  

---

## 🧱 Arquitetura do Projeto

Componentes utilizados:

- **Amazon API Gateway (HTTP API)** – Gerenciamento das rotas  
- **AWS Lambda** – Processamento das requisições  
- **Amazon S3** – Frontend consumindo a API  

---

## 🔁 Fluxo da aplicação

Usuário → Frontend (S3)  
⬇️  
API Gateway  
⬇️  
Lambda  
⬇️  
(Futuramente DynamoDB)

---

## 🔌 Estrutura das Rotas

As rotas foram criadas para cada funcionalidade da aplicação:

| Método | Rota        | Lambda            |
|--------|------------|------------------|
| POST   | /login     | lambda-login     |
| GET    | /filmes    | lambda-filmes    |
| POST   | /cadastro  | lambda-cadastro  |
| POST   | /favoritos | lambda-favoritos |

---

## 🧪 Exemplo de Endpoint

### 🔹 Login

```http
POST /login
```

### Body:
```json
{
  "login": "admin",
  "senha": "123"
}
```

### Resposta:
```json
{
  "success": true,
  "usuario": {
    "login": "admin"
  }
}
```

---

## ⚙️ Configurações Importantes

### ✔️ CORS

Para permitir acesso do frontend:

- Access-Control-Allow-Origin: *
- Methods: GET, POST, OPTIONS
- Headers: Content-Type

---

### ✔️ Stage ($default)

- Implantação automática habilitada  
- APIs publicadas automaticamente  
- Não é necessário deploy manual  

---

## ⚠️ Problemas encontrados

Durante a implementação, alguns erros comuns foram identificados:

- ❌ `404 Not Found` → rota não criada  
- ❌ `Failed to fetch` → erro de CORS ou endpoint  
- ❌ `ERR_NAME_NOT_RESOLVED` → problema de DNS  
- ❌ `Unexpected token '<'` → retorno HTML ao invés de JSON  

---

## 🚀 Benefícios do API Gateway

- 🌐 Exposição simples de APIs  
- 🔗 Integração nativa com Lambda  
- 📈 Escalabilidade automática  
- 🔒 Controle de acesso e segurança  
- ⚡ Baixa latência com HTTP API  

---

## 🧠 Aprendizados

- Criação de APIs REST/HTTP na AWS  
- Integração entre serviços serverless  
- Configuração de rotas e métodos  
- Tratamento de erros em APIs  
- Configuração de CORS  

---

## 📌 Próximos Passos

- 🗄️ Integrar com DynamoDB  
- 🔐 Implementar autenticação (JWT/Cognito)  
- ⚙️ Criar infraestrutura como código (CloudFormation)  
- 🔄 Implementar CI/CD  
- 🛡️ Adicionar AWS WAF  

---

## 👨‍💻 Autor

Projeto desenvolvido por **Luiz Inhesta** 💻  
Evoluindo na prática com arquitetura moderna em Cloud ☁️🚀  
