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
          attributes: ['id', 'name', 'email', 'role']
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
    const { name, email, phone, plan = 'basic', maxUsers = 5, maxQueues = 3 } = req.body;

    if (!name || !email) {
      return res.status(400).json({ 
        error: 'Nome e email são obrigatórios' 
      });
    }

    // Verificar se já existe empresa com o mesmo email
    const existingCompany = await Company.findOne({ where: { email } });
    if (existingCompany) {
      return res.status(400).json({ 
        error: 'Já existe uma empresa com este email' 
      });
    }

    const company = await Company.create({
      name,
      email,
      phone,
      plan,
      maxUsers,
      maxQueues,
      isActive: true
    });

    res.status(201).json(company);
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
    const updateData = req.body;

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

    await company.update(updateData);

    res.json(company);
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
