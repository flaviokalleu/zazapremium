# Sistema SaaS Multi-Empresas - Zazap

## Visão Geral

O sistema foi transformado em uma plataforma SaaS multi-empresas, onde um administrador master pode gerenciar múltiplas empresas em uma única instalação.

## Características Principais

### 🏢 Multi-Tenancy (Multi-Inquilino)
- **Isolamento completo de dados**: Cada empresa tem seus próprios usuários, tickets, filas, etc.
- **Administração centralizada**: Um admin master gerencia todas as empresas
- **Acesso único**: Todas as empresas acessam pelo mesmo domínio/URL

### 👤 Níveis de Usuário

1. **Master Admin** (`isMasterAdmin: true`)
   - Pode criar e gerenciar empresas
   - Pode acessar dados de qualquer empresa
   - Não pode ter o status de master admin alterado

2. **Admin da Empresa** (`role: 'admin'`)
   - Gerencia apenas sua própria empresa
   - Pode criar usuários da empresa
   - Limitado pelo plano da empresa

3. **Usuários Normais** (`role: 'supervisor'` ou `'attendant'`)
   - Acesso apenas aos dados da sua empresa
   - Funcionalidades limitadas pelo nível de acesso

## Configuração Inicial

### 1. Executar Setup SaaS

```bash
cd backend
npm run setup:saas
```

Este comando irá:
- Executar todas as migrações necessárias
- Criar a empresa master
- Criar o usuário administrador master

### 2. Credenciais Padrão

**Administrador Master:**
- Email: `admin@zazap.com`
- Senha: `admin123`
- ⚠️ **Altere a senha após o primeiro login!**

## Como Usar

### 1. Login como Master Admin

Faça login com as credenciais do administrador master para acessar o painel de controle de empresas.

### 2. Criar Empresas

No painel administrativo, você pode:
- Criar novas empresas
- Definir planos e limites
- Ativar/desativar empresas
- Gerenciar configurações

### 3. Gerenciar Usuários

Cada empresa pode ter seus próprios usuários com diferentes níveis de acesso.

### 4. Isolamento de Dados

Todos os dados (tickets, filas, contatos, etc.) são automaticamente filtrados por empresa.

## Estrutura do Banco de Dados

### Tabela `companies`
```sql
- id (PK)
- name (Nome da empresa)
- email (Email de contato)
- phone (Telefone)
- plan (Plano: basic, premium, unlimited)
- maxUsers (Limite de usuários)
- maxQueues (Limite de filas)
- isActive (Empresa ativa/inativa)
```

### Alterações nas Tabelas Existentes
Todas as tabelas principais agora incluem:
- `companyId` (FK para companies)

### Campo de Segurança
- `users.isMasterAdmin` (Boolean, imutável)

## API Endpoints

### Gerenciamento de Empresas (Master Admin)
```
GET    /api/companies              # Listar empresas
POST   /api/companies              # Criar empresa
GET    /api/companies/:id          # Obter empresa
PUT    /api/companies/:id          # Atualizar empresa
PATCH  /api/companies/:id/toggle-status  # Ativar/Desativar
DELETE /api/companies/:id          # Excluir empresa
```

### Empresas Acessíveis (Todos os usuários)
```
GET    /api/companies/accessible   # Empresas que o usuário pode acessar
```

## Headers para Seleção de Empresa (Master Admin)

O Master Admin pode especificar qual empresa acessar:

```http
X-Company-Id: 123
```

ou via query parameter:

```http
GET /api/users?companyId=123
```

## Middleware de Isolamento

### `tenantMiddleware`
- Identifica a empresa do usuário
- Define `req.companyId` e `req.company`
- Permite que Master Admin especifique empresa

### `requireMasterAdmin`
- Garante que apenas Master Admin acesse certas rotas

### `requireCompany`
- Exige que uma empresa esteja selecionada

## Limitações por Plano

### Basic
- Máximo 5 usuários
- Máximo 3 filas

### Premium
- Máximo 20 usuários
- Máximo 10 filas

### Unlimited
- Usuários ilimitados
- Filas ilimitadas

## Segurança

### Proteções Implementadas

1. **Isolamento de Dados**: Automático por empresa
2. **Validação de Limites**: Respeitados ao criar usuários/filas
3. **Proteção do Master Admin**: Campo `isMasterAdmin` é imutável
4. **Validação de Empresa**: Empresa deve estar ativa

### Boas Práticas

1. **Altere a senha padrão** do Master Admin
2. **Configure limites apropriados** para cada plano
3. **Monitore o uso** de recursos por empresa
4. **Faça backup regular** dos dados

## Migração de Dados Existentes

Se você já possui dados no sistema:

1. Execute o setup SaaS
2. Os dados existentes precisarão ser associados a uma empresa
3. Execute um script de migração de dados (se necessário)

## Desenvolvimento

### Adicionando Novos Recursos

Ao criar novos controllers/models:

1. **Inclua isolamento por empresa** nos queries
2. **Use o middleware de tenant** nas rotas
3. **Verifique permissões** adequadamente
4. **Teste com múltiplas empresas**

### Exemplo de Controller

```javascript
export const getMyData = async (req, res) => {
  try {
    // req.companyId é definido pelo tenantMiddleware
    const data = await MyModel.findAll({
      where: { companyId: req.companyId }
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

## Troubleshooting

### Problemas Comuns

1. **"Empresa não especificada"**
   - Verifique se o middleware de tenant está sendo usado
   - Master Admin precisa especificar empresa via header/query

2. **"Usuário não possui empresa"**
   - Usuário não foi associado a uma empresa
   - Empresa pode estar inativa

3. **"Limite de usuários atingido"**
   - Verifique o plano da empresa
   - Atualize o limite se necessário

## Monitoramento

Recomenda-se monitorar:
- Número de empresas ativas
- Uso de recursos por empresa
- Limites próximos de serem atingidos
- Tentativas de acesso negado

## Backup e Restauração

- Faça backup regular da base de dados
- Considere backup separado por empresa se necessário
- Teste a restauração periodicamente
