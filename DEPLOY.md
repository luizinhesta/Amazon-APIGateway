# Passo a passo de implantacao na AWS

Este guia segue exatamente o seu fluxo:
1. Criar VPC e sub-redes
2. Criar RDS privado e Bastion
3. Construir imagem e subir no ECR
4. Criar ECS (Fargate) com ALB
5. Criar API Gateway (usuarios e CEP)
6. Subir o site no S3

> Observacao: Este guia considera a regiao **us-east-1**.

## 1. VPC e Rede
Crie uma VPC com 2 AZs:
- 2 subnets publicas (ALB e Bastion)
- 2 subnets privadas (ECS e RDS)
- Internet Gateway
- NAT Gateway (para ECS acessar internet, se necessario)

Tabela de rotas:
- Publica: `0.0.0.0/0 -> IGW`
- Privada: `0.0.0.0/0 -> NAT`

## 2. Security Groups (SG)
Crie os SGs:
1. `sg-alb`:
   - Inbound: HTTP 80 (0.0.0.0/0) e/ou HTTPS 443
   - Outbound: All
2. `sg-ecs`:
   - Inbound: HTTP 80 (source: `sg-alb`)
   - Outbound: All (ou restrito conforme necessidade)
3. `sg-rds`:
   - Inbound: MySQL 3306 (source: `sg-ecs` e `sg-bastion`)
   - Outbound: All
4. `sg-bastion`:
   - Inbound: SSH 22 (seu IP publico)
   - Outbound: All

## 3. RDS (privado)
- Engine: MySQL
- Subnet group: subnets privadas
- SG: `sg-rds`
- Public access: **No**

Depois, importe o schema:
- Use o bastion para conectar no RDS
- Execute o SQL em `database/schema.sql`

## 4. Bastion Host
- EC2 em subnet publica
- SG: `sg-bastion`
- Use uma chave SSH

Conecte e teste o RDS via bastion:
```bash
mysql -h <ENDPOINT_RDS> -u <USER> -p
```

## 5. ECR (imagem)
Este e o **unico passo com AWS CLI** (como voce pediu).
Crie o repositorio no ECR e faca push:
```bash
cd ecs

docker build -t usuario-api .

aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

docker tag usuario-api:latest <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/usuario-api:latest

docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/usuario-api:latest
```

## 6. IAM Roles (minimas)
Crie apenas o necessario.

### 6.1 Task Execution Role (ECS)
Usar a policy **AWS managed**:
- `AmazonECSTaskExecutionRolePolicy`

Permissoes que ela cobre:
- Pull da imagem no ECR
- Logs no CloudWatch

### 6.2 Task Role (ECS)
Somente se sua aplicacao precisar chamar AWS APIs.
No seu caso, **nao precisa** (a API PHP so acessa RDS).

### 6.3 Role do Lambda (CEP)
Crie role customizada com permissao minima:
- `logs:CreateLogGroup`
- `logs:CreateLogStream`
- `logs:PutLogEvents`

Se usar VPC no Lambda, adicione:
- `ec2:CreateNetworkInterface`
- `ec2:DescribeNetworkInterfaces`
- `ec2:DeleteNetworkInterface`

### 6.4 API Gateway
Nao precisa de role se for **HTTP API** com integracao Lambda/ALB.

## 7. ECS (Fargate)
1. Crie o cluster ECS
2. Task Definition:
   - Tipo: Fargate
   - Container: imagem do ECR
   - Porta: 80
   - Env vars do RDS:
     - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`
3. Service:
   - Subnets privadas
   - SG: `sg-ecs`
   - Load balancer: ALB nas subnets publicas

Anote o **DNS do ALB**.

## 8. API Gateway para usuarios
Recomendado: **HTTP API**
- Integracao: ALB do ECS
- Rota: `ANY /{proxy+}`
- CORS: `GET, POST, PUT, OPTIONS`

URL final sera usada no frontend.

## 9. Lambda + API Gateway (CEP)
1. Crie Lambda (Node.js 18)
2. Suba `lambda/cep-lookup/index.js`
3. Crie HTTP API
   - Rota: `GET /cep`
   - Integracao: Lambda
   - CORS habilitado

Guarde a URL final.

## 10. S3 (site estatico)
1. Crie bucket e habilite **Static Website Hosting**
2. Suba os arquivos da raiz:
   - `index.html`, `cadastro.html`, `bemvindo.html`, `editar-usuario.html`
   - `app-config.js`, `app.js`, `styles-devops.css`, `script-devops.js`, `images/`
3. Atualize `app-config.js`:
```js
window.APP_CONFIG = {
  API_BASE_URL: 'https://SEU-API-USUARIOS.execute-api.us-east-1.amazonaws.com',
  CEP_API_URL: 'https://SEU-API-CEP.execute-api.us-east-1.amazonaws.com/cep'
};
```

## 11. Testes finais
- Teste o cadastro e login
- Verifique se a busca de CEP preenche o endereco
- Teste editar usuario

## Observacoes finais
- Se quiser HTTPS no S3, use CloudFront.
- O RDS fica privado, acesso so via SG do ECS e Bastion.
- A API PHP nao usa IAM, apenas MySQL.
