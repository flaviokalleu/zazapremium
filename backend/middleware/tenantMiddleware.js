import { Company, User } from '../models/index.js';

// Middleware para isolamento de tenant baseado no usuário logado
const tenantMiddleware = async (req, res, next) => {
  try {
    // Se não há usuário autenticado, pula o middleware
    if (!req.user) {
      return next();
    }

    // Buscar usuário completo com informações de master admin
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Company, as: 'company' }]
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    // Se é o admin master, pode acessar qualquer empresa
    if (user.isMasterAdmin) {
      // Se foi especificada uma empresa no header ou query, usa ela
      const companyId = req.headers['x-company-id'] || req.query.companyId;
      if (companyId) {
        const company = await Company.findByPk(companyId);
        if (company) {
          req.company = company;
          req.companyId = company.id;
        }
      }
      req.isMasterAdmin = true;
      return next();
    }

    // Para usuários normais, usar a empresa do usuário
    if (!user.company) {
      return res.status(403).json({ 
        error: 'Usuário não possui empresa associada' 
      });
    }

    // Se a empresa está inativa, bloqueia acesso
    if (!user.company.isActive) {
      return res.status(403).json({ 
        error: 'Empresa inativa. Entre em contato com o suporte.' 
      });
    }

    // Adiciona informações da empresa na requisição
    req.company = user.company;
    req.companyId = user.company.id;
    req.isMasterAdmin = false;
    
    next();
  } catch (error) {
    console.error('Erro no middleware de tenant:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Middleware específico para rotas que exigem empresa
const requireCompany = (req, res, next) => {
  if (!req.companyId) {
    return res.status(400).json({ 
      error: 'Empresa não especificada. Selecione uma empresa.' 
    });
  }
  next();
};

// Middleware para verificar se o usuário é admin master
const requireMasterAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

  // Verificar se tem a flag de master admin no request (setada pelo tenantMiddleware)
  if (!req.isMasterAdmin) {
    return res.status(403).json({ 
      error: 'Acesso negado. Apenas o administrador master pode acessar esta funcionalidade.' 
    });
  }
  next();
};

export {
  tenantMiddleware,
  requireCompany,
  requireMasterAdmin
};
