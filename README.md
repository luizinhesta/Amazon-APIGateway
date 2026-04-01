# Amazon-APIGateway

Este projeto foi modernizado para:
- Frontend estatico em **S3** (HTML/CSS/JS)
- API de usuarios em **ECS (PHP)** conectando no **RDS**
- Busca de **CEP via API Gateway + Lambda**

O conteudo do site foi mantido, mas as paginas nao sao mais PHP. A autenticacao e o cadastro agora acontecem via API.

## Estrutura
Arquivos do S3 ficam na raiz:
- `index.html`, `cadastro.html`, `bemvindo.html`, `editar-usuario.html`
- `app-config.js`, `app.js`, `styles-devops.css`, `script-devops.js`
- `images/`

Arquivos do ECS ficam em `ecs/`:
- `ecs/api/api.php`
- `ecs/lib/`
- `ecs/config/`
- `ecs/bootstrap.php`
- `ecs/.env.example`
- `ecs/Dockerfile`

Banco:
- `database/schema.sql`

Lambda:
- `lambda/cep-lookup/index.js`

## Banco de Dados (RDS)
Crie/atualize a tabela `usuarios`:

```sql
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  login VARCHAR(80) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  cep VARCHAR(9) NULL,
  logradouro VARCHAR(120) NULL,
  bairro VARCHAR(120) NULL,
  cidade VARCHAR(120) NULL,
  uf VARCHAR(2) NULL,
  numero VARCHAR(20) NULL,
  complemento VARCHAR(120) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

Se a tabela ja existir, use `ALTER TABLE` para adicionar as colunas de endereco.

## API de Usuarios (PHP no ECS)
### Endpoints
- `POST /api.php?action=login`
- `POST /api.php?action=create`
- `GET /api.php?action=get&id=1`
- `GET /api.php?action=find&login=usuario`
- `PUT /api.php?action=update&id=1`

### Variaveis de Ambiente (ECS Task Definition)
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASS`

## Docker (ECS)
O container serve **somente a API**:

```bash
# build local
cd ecs

docker build -t usuario-api .

# teste local
Docker run -p 8080:80 \
  -e DB_HOST=... -e DB_PORT=3306 -e DB_NAME=... \
  -e DB_USER=... -e DB_PASS=... \
  usuario-api
```

### Push para ECR
1. Crie o repositorio no ECR
2. Faca login e push da imagem

```bash
aws ecr get-login-password --region sa-east-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.sa-east-1.amazonaws.com

docker tag usuario-api:latest <ACCOUNT_ID>.dkr.ecr.sa-east-1.amazonaws.com/usuario-api:latest

docker push <ACCOUNT_ID>.dkr.ecr.sa-east-1.amazonaws.com/usuario-api:latest
```

### ECS (Fargate)
1. Crie um Cluster ECS
2. Task Definition (Fargate) com as variaveis do RDS
3. Service com **ALB** (porta 80)
4. Security Group liberando o ALB para o container
5. Security Group do RDS permitindo o SG do ECS

Anote o **DNS do ALB**, ele sera usado no frontend.

## API Gateway (para usuarios no ECS)
Opcao recomendada: **HTTP API** com integracao **ALB**.
1. Crie um HTTP API
2. Integracao: `ALB` do ECS
3. Rota: `ANY /{proxy+}`
4. Habilite CORS para `GET, POST, PUT, OPTIONS`

A URL do API Gateway (ou do ALB) vai no `app-config.js`.

## Lambda + API Gateway (CEP)
### Lambda
- Runtime: **Node.js 18**
- Handler: `index.handler`
- Codigo: `lambda/cep-lookup/index.js`

### API Gateway
1. Crie um HTTP API (ou REST API)
2. Integracao: Lambda `cep-lookup`
3. Rota: `GET /cep`
4. Habilite CORS

A URL resultante vai no `app-config.js` em `CEP_API_URL`.

## Frontend (S3)
1. Crie bucket S3 e habilite **Static Website Hosting**
2. Suba os arquivos da raiz (HTML/JS/CSS/images)
3. Atualize `app-config.js` com as URLs das APIs

Exemplo de `app-config.js`:
```js
window.APP_CONFIG = {
  API_BASE_URL: 'https://SEU-API-USUARIOS.execute-api.sa-east-1.amazonaws.com',
  CEP_API_URL: 'https://SEU-API-CEP.execute-api.sa-east-1.amazonaws.com/cep'
};
```

## Observacoes
- O login e edicao usam LocalStorage (lab/demo).
- Para producao, implemente token/JWT e HTTPS com CloudFront.
- A API PHP ja retorna CORS, mas o ideal e habilitar CORS no API Gateway.
