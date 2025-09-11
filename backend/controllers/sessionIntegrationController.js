import { SessionIntegrations, Session, Integration, Company } from '../models/index.js';
import { Op } from 'sequelize';

// Listar todas as integrações de sessão da empresa
export const getSessionIntegrations = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { page = 1, limit = 10, sessionId, integrationId, isActive } = req.query;

    const offset = (page - 1) * limit;

    // Filtros opcionais
    const where = { companyId };
    if (sessionId) where.sessionId = sessionId;
    if (integrationId) where.integrationId = integrationId;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const sessionIntegrations = await SessionIntegrations.findAndCountAll({
      where,
      include: [
        {
          model: Session,
          as: 'session',
          attributes: ['id', 'name', 'status', 'qrcode']
        },
        {
          model: Integration,
          as: 'integration',
          attributes: ['id', 'name', 'type', 'isActive']
        }
      ],
      order: [['updatedAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      sessionIntegrations: sessionIntegrations.rows,
      total: sessionIntegrations.count,
      page: parseInt(page),
      totalPages: Math.ceil(sessionIntegrations.count / limit)
    });
  } catch (error) {
    console.error('Erro ao buscar integrações de sessão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar integração de sessão por ID
export const getSessionIntegrationById = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;

    const sessionIntegration = await SessionIntegrations.findOne({
      where: { 
        id, 
        companyId 
      },
      include: [
        {
          model: Session,
          as: 'session',
          attributes: ['id', 'name', 'status', 'qrcode']
        },
        {
          model: Integration,
          as: 'integration',
          attributes: ['id', 'name', 'type', 'isActive']
        }
      ]
    });

    if (!sessionIntegration) {
      return res.status(404).json({ error: 'Integração de sessão não encontrada' });
    }

    res.json(sessionIntegration);
  } catch (error) {
    console.error('Erro ao buscar integração de sessão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar nova integração de sessão
export const createSessionIntegration = async (req, res) => {
  try {
    const { companyId } = req.user;
    const sessionIntegrationData = { 
      ...req.body, 
      companyId 
    };

    // Validar se a sessão existe e pertence à empresa
    const session = await Session.findOne({
      where: { 
        id: sessionIntegrationData.sessionId, 
        companyId 
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Sessão não encontrada' });
    }

    // Validar se a integração existe e pertence à empresa  
    const integration = await Integration.findOne({
      where: { 
        id: sessionIntegrationData.integrationId, 
        companyId 
      }
    });

    if (!integration) {
      return res.status(404).json({ error: 'Integração não encontrada' });
    }

    // Verificar se já existe uma integração para essa sessão e integração
    const existingSessionIntegration = await SessionIntegrations.findOne({
      where: {
        sessionId: sessionIntegrationData.sessionId,
        integrationId: sessionIntegrationData.integrationId,
        companyId
      }
    });

    if (existingSessionIntegration) {
      return res.status(400).json({ 
        error: 'Já existe uma configuração de integração para esta sessão e integração' 
      });
    }

    const sessionIntegration = await SessionIntegrations.create(sessionIntegrationData);

    // Buscar a integração criada com os relacionamentos
    const createdSessionIntegration = await SessionIntegrations.findOne({
      where: { id: sessionIntegration.id },
      include: [
        {
          model: Session,
          as: 'session',
          attributes: ['id', 'name', 'status', 'qrcode']
        },
        {
          model: Integration,
          as: 'integration',
          attributes: ['id', 'name', 'type', 'isActive']
        }
      ]
    });

    res.status(201).json(createdSessionIntegration);
  } catch (error) {
    console.error('Erro ao criar integração de sessão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar integração de sessão
export const updateSessionIntegration = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;
    const updateData = req.body;

    // Buscar a integração de sessão existente
    const sessionIntegration = await SessionIntegrations.findOne({
      where: { 
        id, 
        companyId 
      }
    });

    if (!sessionIntegration) {
      return res.status(404).json({ error: 'Integração de sessão não encontrada' });
    }

    // Se estiver mudando sessionId ou integrationId, validar
    if (updateData.sessionId && updateData.sessionId !== sessionIntegration.sessionId) {
      const session = await Session.findOne({
        where: { 
          id: updateData.sessionId, 
          companyId 
        }
      });

      if (!session) {
        return res.status(404).json({ error: 'Nova sessão não encontrada' });
      }
    }

    if (updateData.integrationId && updateData.integrationId !== sessionIntegration.integrationId) {
      const integration = await Integration.findOne({
        where: { 
          id: updateData.integrationId, 
          companyId 
        }
      });

      if (!integration) {
        return res.status(404).json({ error: 'Nova integração não encontrada' });
      }
    }

    // Verificar conflitos se mudando sessionId ou integrationId
    if (updateData.sessionId || updateData.integrationId) {
      const checkSessionId = updateData.sessionId || sessionIntegration.sessionId;
      const checkIntegrationId = updateData.integrationId || sessionIntegration.integrationId;

      const existingSessionIntegration = await SessionIntegrations.findOne({
        where: {
          sessionId: checkSessionId,
          integrationId: checkIntegrationId,
          companyId,
          id: { [Op.ne]: id } // Excluir o próprio registro da verificação
        }
      });

      if (existingSessionIntegration) {
        return res.status(400).json({ 
          error: 'Já existe uma configuração de integração para esta sessão e integração' 
        });
      }
    }

    await sessionIntegration.update(updateData);

    // Buscar a integração atualizada com os relacionamentos
    const updatedSessionIntegration = await SessionIntegrations.findOne({
      where: { id: sessionIntegration.id },
      include: [
        {
          model: Session,
          as: 'session',
          attributes: ['id', 'name', 'status', 'qrcode']
        },
        {
          model: Integration,
          as: 'integration',
          attributes: ['id', 'name', 'type', 'isActive']
        }
      ]
    });

    res.json(updatedSessionIntegration);
  } catch (error) {
    console.error('Erro ao atualizar integração de sessão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Deletar integração de sessão
export const deleteSessionIntegration = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;

    const sessionIntegration = await SessionIntegrations.findOne({
      where: { 
        id, 
        companyId 
      }
    });

    if (!sessionIntegration) {
      return res.status(404).json({ error: 'Integração de sessão não encontrada' });
    }

    await sessionIntegration.destroy();

    res.json({ message: 'Integração de sessão deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar integração de sessão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Ativar/Desativar integração de sessão
export const toggleSessionIntegration = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;

    const sessionIntegration = await SessionIntegrations.findOne({
      where: { 
        id, 
        companyId 
      }
    });

    if (!sessionIntegration) {
      return res.status(404).json({ error: 'Integração de sessão não encontrada' });
    }

    await sessionIntegration.update({ 
      isActive: !sessionIntegration.isActive 
    });

    // Buscar a integração atualizada com os relacionamentos
    const updatedSessionIntegration = await SessionIntegrations.findOne({
      where: { id: sessionIntegration.id },
      include: [
        {
          model: Session,
          as: 'session',
          attributes: ['id', 'name', 'status', 'qrcode']
        },
        {
          model: Integration,
          as: 'integration',
          attributes: ['id', 'name', 'type', 'isActive']
        }
      ]
    });

    res.json(updatedSessionIntegration);
  } catch (error) {
    console.error('Erro ao alterar status da integração de sessão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar integrações de uma sessão específica
export const getIntegrationsBySession = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { sessionId } = req.params;

    // Validar se a sessão existe e pertence à empresa
    const session = await Session.findOne({
      where: { 
        id: sessionId, 
        companyId 
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Sessão não encontrada' });
    }

    const sessionIntegrations = await SessionIntegrations.findAll({
      where: { 
        sessionId, 
        companyId 
      },
      include: [
        {
          model: Integration,
          as: 'integration',
          attributes: ['id', 'name', 'type', 'isActive']
        }
      ],
      order: [['updatedAt', 'DESC']]
    });

    res.json(sessionIntegrations);
  } catch (error) {
    console.error('Erro ao buscar integrações da sessão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
