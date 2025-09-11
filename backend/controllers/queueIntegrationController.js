import { QueueIntegrations, Queue, Integration } from '../models/index.js';
import { Op } from 'sequelize';

// Criar nova integração de fila
export const createQueueIntegration = async (req, res) => {
  try {
    const { companyId } = req.user;
    const {
      queueId,
      integrationId,
      urlN8N,
      typebotSlug,
      typebotExpires,
      typebotKeywordFinish,
      typebotKeywordRestart,
      typebotUnknownMessage,
      typebotDelayMessage,
      typebotRestartMessage,
      active
    } = req.body;

    // Verificar se a fila e integração pertencem à empresa
    const queue = await Queue.findOne({
      where: { id: queueId, companyId }
    });

    if (!queue) {
      return res.status(404).json({ message: 'Fila não encontrada' });
    }

    const integration = await Integration.findOne({
      where: { id: integrationId, companyId }
    });

    if (!integration) {
      return res.status(404).json({ message: 'Integração não encontrada' });
    }

    // Verificar se já existe a mesma integração para esta fila
    const existingQueueIntegration = await QueueIntegrations.findOne({
      where: { queueId, integrationId, companyId }
    });

    if (existingQueueIntegration) {
      return res.status(400).json({ 
        message: 'Esta integração já está configurada para esta fila' 
      });
    }

    const queueIntegration = await QueueIntegrations.create({
      queueId,
      integrationId,
      companyId,
      urlN8N,
      typebotSlug,
      typebotExpires: typebotExpires || 0,
      typebotKeywordFinish: typebotKeywordFinish || 'sair',
      typebotKeywordRestart: typebotKeywordRestart || 'reiniciar',
      typebotUnknownMessage: typebotUnknownMessage || 'Desculpe, não entendi. Pode repetir?',
      typebotDelayMessage: typebotDelayMessage || 1000,
      typebotRestartMessage: typebotRestartMessage || 'Conversa reiniciada com sucesso!',
      active: active !== undefined ? active : true
    });

    // Buscar a integração criada com as associações
    const createdQueueIntegration = await QueueIntegrations.findByPk(queueIntegration.id, {
      include: [
        {
          model: Queue,
          as: 'queue',
          attributes: ['id', 'name']
        },
        {
          model: Integration,
          as: 'integration',
          attributes: ['id', 'name', 'type']
        }
      ]
    });

    res.status(201).json(createdQueueIntegration);
  } catch (error) {
    console.error('Erro ao criar integração de fila:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Buscar todas as integrações de fila da empresa
export const getQueueIntegrations = async (req, res) => {
  try {
    const { companyId } = req.user;

    const queueIntegrations = await QueueIntegrations.findAll({
      where: { companyId },
      include: [
        {
          model: Queue,
          as: 'queue',
          attributes: ['id', 'name']
        },
        {
          model: Integration,
          as: 'integration',
          attributes: ['id', 'name', 'type']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(queueIntegrations);
  } catch (error) {
    console.error('Erro ao buscar integrações de fila:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Buscar integração de fila por ID
export const getQueueIntegrationById = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;

    const queueIntegration = await QueueIntegrations.findOne({
      where: { id, companyId },
      include: [
        {
          model: Queue,
          as: 'queue',
          attributes: ['id', 'name']
        },
        {
          model: Integration,
          as: 'integration',
          attributes: ['id', 'name', 'type']
        }
      ]
    });

    if (!queueIntegration) {
      return res.status(404).json({ message: 'Integração de fila não encontrada' });
    }

    res.json(queueIntegration);
  } catch (error) {
    console.error('Erro ao buscar integração de fila:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Buscar integração de fila por queueId
export const getQueueIntegrationByQueueId = async (queueId, companyId) => {
  try {
    const queueIntegration = await QueueIntegrations.findOne({
      where: { queueId, companyId, active: true },
      include: [
        {
          model: Integration,
          as: 'integration',
          attributes: ['id', 'name', 'type']
        }
      ]
    });

    return queueIntegration;
  } catch (error) {
    console.error('Erro ao buscar integração por fila:', error);
    return null;
  }
};

// Atualizar integração de fila
export const updateQueueIntegration = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;
    const {
      queueId,
      integrationId,
      urlN8N,
      typebotSlug,
      typebotExpires,
      typebotKeywordFinish,
      typebotKeywordRestart,
      typebotUnknownMessage,
      typebotDelayMessage,
      typebotRestartMessage,
      active
    } = req.body;

    const queueIntegration = await QueueIntegrations.findOne({
      where: { id, companyId }
    });

    if (!queueIntegration) {
      return res.status(404).json({ message: 'Integração de fila não encontrada' });
    }

    // Se mudou a fila, verificar se não existe conflito
    if (queueId && queueId !== queueIntegration.queueId) {
      const existingQueueIntegration = await QueueIntegrations.findOne({
        where: { queueId, companyId, id: { [Op.ne]: id } }
      });

      if (existingQueueIntegration) {
        return res.status(400).json({ 
          message: 'Já existe uma integração configurada para esta fila' 
        });
      }

      // Verificar se a nova fila existe
      const queue = await Queue.findOne({
        where: { id: queueId, companyId }
      });

      if (!queue) {
        return res.status(404).json({ message: 'Fila não encontrada' });
      }
    }

    // Se mudou a integração, verificar se existe
    if (integrationId && integrationId !== queueIntegration.integrationId) {
      const integration = await Integration.findOne({
        where: { id: integrationId, companyId }
      });

      if (!integration) {
        return res.status(404).json({ message: 'Integração não encontrada' });
      }
    }

    await queueIntegration.update({
      queueId: queueId || queueIntegration.queueId,
      integrationId: integrationId || queueIntegration.integrationId,
      urlN8N,
      typebotSlug,
      typebotExpires,
      typebotKeywordFinish,
      typebotKeywordRestart,
      typebotUnknownMessage,
      typebotDelayMessage,
      typebotRestartMessage,
      active
    });

    // Buscar a integração atualizada com as associações
    const updatedQueueIntegration = await QueueIntegrations.findByPk(queueIntegration.id, {
      include: [
        {
          model: Queue,
          as: 'queue',
          attributes: ['id', 'name']
        },
        {
          model: Integration,
          as: 'integration',
          attributes: ['id', 'name', 'type']
        }
      ]
    });

    res.json(updatedQueueIntegration);
  } catch (error) {
    console.error('Erro ao atualizar integração de fila:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Excluir integração de fila
export const deleteQueueIntegration = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;

    const queueIntegration = await QueueIntegrations.findOne({
      where: { id, companyId }
    });

    if (!queueIntegration) {
      return res.status(404).json({ message: 'Integração de fila não encontrada' });
    }

    await queueIntegration.destroy();

    res.json({ message: 'Integração de fila excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir integração de fila:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};
