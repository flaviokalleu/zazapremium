import { Company, User, Queue, Ticket } from '../models/index.js';
import { Op } from 'sequelize';

// Listar todas as empresas (apenas admin master)
const getAllCompanies = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const companies = await Company.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id', 'name', 'email', 'role', 'isActive', 'createdAt'],
          order: [['role', 'ASC'], ['createdAt', 'ASC']] // Admin primeiro, depois por ordem de criação
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      companies: companies.rows,
      pagination: {
        total: companies.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(companies.count / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar empresas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar nova empresa
const createCompany = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      plan = 'basic', 
      maxUsers = 5, 
      maxQueues = 3,
      // Dados do responsável
      adminName,
      adminEmail,
      adminPassword
    } = req.body;

    // Validações básicas da empresa
    if (!name || !email) {
      return res.status(400).json({ 
        error: 'Nome e email da empresa são obrigatórios' 
      });
    }

    // Validações do responsável
    if (!adminName || !adminEmail || !adminPassword) {
      return res.status(400).json({ 
        error: 'Nome, email e senha do responsável são obrigatórios' 
      });
    }

    if (adminPassword.length < 6) {
      return res.status(400).json({ 
        error: 'A senha do responsável deve ter pelo menos 6 caracteres' 
      });
    }

    // Verificar se já existe empresa com o mesmo email
    const existingCompany = await Company.findOne({ where: { email } });
    if (existingCompany) {
      return res.status(400).json({ 
        error: 'Já existe uma empresa com este email' 
      });
    }

    // Verificar se já existe usuário com o email do responsável
    const existingUser = await User.findOne({ where: { email: adminEmail } });
    if (existingUser) {
      return res.status(400).json({ 
        error: 'Já existe um usuário com este email' 
      });
    }

    // Importar bcrypt para hash da senha
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Criar empresa
    const company = await Company.create({
      name,
      email,
      phone,
      plan,
      maxUsers,
      maxQueues,
      isActive: true
    });

    // Criar usuário responsável
    const adminUser = await User.create({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      companyId: company.id,
      isActive: true,
      isMasterAdmin: false
    });

    // Retornar empresa criada com dados do responsável (sem senha)
    const responseData = {
      ...company.toJSON(),
      admin: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role
      }
    };

    res.status(201).json(responseData);
  } catch (error) {
    console.error('Erro ao criar empresa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter empresa por ID
const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await Company.findByPk(id, {
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id', 'name', 'email', 'role', 'isActive']
        },
        {
          model: Queue,
          as: 'queues',
          attributes: ['id', 'name', 'description', 'isActive']
        }
      ]
    });

    if (!company) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    // Estatísticas da empresa
    const stats = await getCompanyStats(id);

    res.json({
      ...company.toJSON(),
      stats
    });
  } catch (error) {
    console.error('Erro ao obter empresa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar empresa
const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      adminId,
      adminName, 
      adminEmail, 
      adminPassword,
      ...updateData 
    } = req.body;

    // Não permitir alterar o ID
    delete updateData.id;

    const company = await Company.findByPk(id);
    if (!company) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    // Se está alterando o email, verificar se não existe outro com o mesmo
    if (updateData.email && updateData.email !== company.email) {
      const existingCompany = await Company.findOne({ 
        where: { 
          email: updateData.email,
          id: { [Op.ne]: id }
        } 
      });
      if (existingCompany) {
        return res.status(400).json({ 
          error: 'Já existe uma empresa com este email' 
        });
      }
    }

    // Atualizar dados da empresa
    await company.update(updateData);

    // Se tem dados do administrador para atualizar
    if (adminName || adminEmail || adminPassword) {
      // Buscar o administrador atual da empresa
      let admin = null;
      
      if (adminId) {
        // Se tem ID do admin, buscar por ID
        admin = await User.findOne({ 
          where: { 
            id: adminId, 
            companyId: company.id, 
            role: 'admin' 
          } 
        });
      } else {
        // Senão, buscar o primeiro admin da empresa
        admin = await User.findOne({ 
          where: { 
            companyId: company.id, 
            role: 'admin' 
          } 
        });
      }

      if (admin) {
        // Atualizar administrador existente
        const adminUpdateData = {};
        
        if (adminName) adminUpdateData.name = adminName;
        if (adminEmail) {
          // Verificar se email não está em uso por outro usuário
          const existingUser = await User.findOne({ 
            where: { 
              email: adminEmail,
              id: { [Op.ne]: admin.id }
            } 
          });
          if (existingUser) {
            return res.status(400).json({ 
              error: 'Email já está em uso por outro usuário' 
            });
          }
          adminUpdateData.email = adminEmail;
        }
        if (adminPassword) {
          const bcrypt = await import('bcryptjs');
          adminUpdateData.password = await bcrypt.hash(adminPassword, 12);
        }

        await admin.update(adminUpdateData);
      } else if (adminName && adminEmail && adminPassword) {
        // Criar novo administrador se não existe
        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.hash(adminPassword, 12);

        await User.create({
          name: adminName,
          email: adminEmail,
          password: hashedPassword,
          role: 'admin',
          companyId: company.id,
          isActive: true,
          isMasterAdmin: false
        });
      }
    }

    // Recarregar empresa com usuários atualizados
    const updatedCompany = await Company.findByPk(id, {
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id', 'name', 'email', 'role', 'isActive', 'createdAt']
        }
      ]
    });

    res.json(updatedCompany);
  } catch (error) {
    console.error('Erro ao atualizar empresa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Ativar/Desativar empresa
const toggleCompanyStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await Company.findByPk(id);
    if (!company) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    await company.update({ isActive: !company.isActive });

    res.json({ 
      message: `Empresa ${company.isActive ? 'ativada' : 'desativada'} com sucesso`,
      company 
    });
  } catch (error) {
    console.error('Erro ao alterar status da empresa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Excluir empresa (soft delete)
const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await Company.findByPk(id);
    if (!company) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    // Primeiro desativa a empresa
    await company.update({ isActive: false });

    // Depois faz soft delete (se o modelo suportar)
    await company.destroy();

    res.json({ message: 'Empresa excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir empresa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter estatísticas da empresa
const getCompanyStats = async (companyId) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalQueues,
      activeQueues,
      totalTickets,
      openTickets,
      closedTickets
    ] = await Promise.all([
      User.count({ where: { companyId } }),
      User.count({ where: { companyId, isActive: true } }),
      Queue.count({ where: { companyId } }),
      Queue.count({ where: { companyId, isActive: true } }),
      Ticket.count({ where: { companyId } }),
      Ticket.count({ where: { companyId, status: 'open' } }),
      Ticket.count({ where: { companyId, status: 'closed' } })
    ]);

    return {
      users: { total: totalUsers, active: activeUsers },
      queues: { total: totalQueues, active: activeQueues },
      tickets: { total: totalTickets, open: openTickets, closed: closedTickets }
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas da empresa:', error);
    return null;
  }
};

// Obter empresas que o usuário pode acessar (para usuários normais e admin master)
const getAccessibleCompanies = async (req, res) => {
  try {
    const userId = req.user.id;

    // Buscar usuário completo para verificar se é master admin
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'email', 'plan'],
          where: { isActive: true }
        }
      ]
    });

    if (!user) {
      return res.json([]);
    }

    // Se é admin master, retorna todas as empresas
    if (user.isMasterAdmin) {
      const companies = await Company.findAll({
        where: { isActive: true },
        attributes: ['id', 'name', 'email', 'plan'],
        order: [['name', 'ASC']]
      });
      return res.json(companies);
    }

    // Para usuários normais, retorna apenas a empresa dele
    if (!user.company) {
      return res.json([]);
    }

    res.json([user.company]);
  } catch (error) {
    console.error('Erro ao obter empresas acessíveis:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export default {
  getAllCompanies,
  createCompany,
  getCompanyById,
  updateCompany,
  toggleCompanyStatus,
  deleteCompany,
  getCompanyStats,
  getAccessibleCompanies
};
