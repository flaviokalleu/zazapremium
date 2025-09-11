import { QueueIntegrations, SessionIntegrations, Integration } from '../models/index.js';
import { getQueueIntegrationByQueueId } from '../controllers/queueIntegrationController.js';

/**
 * Determina qual integração Typebot usar baseado na prioridade:
 * 1. Integração específica da fila (se o ticket tiver fila)
 * 2. Integração específica da sessão
 * 3. Integração geral da empresa
 */
export async function getTypebotIntegrationForTicket(ticket, sessionId, companyId) {
  try {
    console.log(`🤖 Buscando integração Typebot para ticket ${ticket.id}, fila: ${ticket.queueId}, sessão: ${sessionId}`);

    // 1. Prioridade: Integração específica da fila
    if (ticket.queueId) {
      const queueIntegration = await getQueueIntegrationByQueueId(ticket.queueId, companyId);
      
      if (queueIntegration && queueIntegration.active) {
        console.log(`✅ Usando integração específica da fila ${ticket.queueId}: ${queueIntegration.id}`);
        return {
          type: 'queue',
          integration: queueIntegration,
          config: {
            urlN8N: queueIntegration.urlN8N,
            typebotSlug: queueIntegration.typebotSlug,
            typebotExpires: queueIntegration.typebotExpires,
            typebotKeywordFinish: queueIntegration.typebotKeywordFinish,
            typebotKeywordRestart: queueIntegration.typebotKeywordRestart,
            typebotUnknownMessage: queueIntegration.typebotUnknownMessage,
            typebotDelayMessage: queueIntegration.typebotDelayMessage,
            typebotRestartMessage: queueIntegration.typebotRestartMessage
          }
        };
      }
    }

    // 2. Segunda prioridade: Integração específica da sessão
    const sessionIntegration = await getSessionIntegrationBySessionId(sessionId, companyId);
    
    if (sessionIntegration && sessionIntegration.isActive) {
      // Verificar se a integração da sessão deve funcionar apenas sem fila
      if (sessionIntegration.triggerOnlyWithoutQueue && ticket.queueId) {
        console.log(`⏭️ Integração da sessão ${sessionId} configurada para funcionar apenas sem fila, mas ticket tem fila ${ticket.queueId}`);
        return null;
      }

      console.log(`✅ Usando integração específica da sessão ${sessionId}: ${sessionIntegration.id}`);
      return {
        type: 'session',
        integration: sessionIntegration,
        config: {
          urlN8N: sessionIntegration.urlN8N,
          typebotSlug: sessionIntegration.typebotSlug,
          typebotExpires: sessionIntegration.typebotExpires,
          typebotKeywordFinish: sessionIntegration.typebotKeywordFinish,
          typebotKeywordRestart: sessionIntegration.typebotKeywordRestart,
          typebotUnknownMessage: sessionIntegration.typebotUnknownMessage,
          typebotDelayMessage: sessionIntegration.typebotDelayMessage,
          typebotRestartMessage: sessionIntegration.typebotRestartMessage
        }
      };
    }

    // 3. Terceira prioridade: Integração geral da empresa
    const generalIntegration = await Integration.findOne({
      where: { 
        companyId, 
        type: 'typebot',
        active: true 
      }
    });

    if (generalIntegration) {
      console.log(`✅ Usando integração geral da empresa: ${generalIntegration.id}`);
      return {
        type: 'general',
        integration: generalIntegration,
        config: {
          urlN8N: generalIntegration.urlN8N,
          typebotSlug: generalIntegration.typebotSlug,
          typebotExpires: generalIntegration.typebotExpires,
          typebotKeywordFinish: generalIntegration.typebotKeywordFinish,
          typebotKeywordRestart: generalIntegration.typebotKeywordRestart,
          typebotUnknownMessage: generalIntegration.typebotUnknownMessage,
          typebotDelayMessage: generalIntegration.typebotDelayMessage,
          typebotRestartMessage: generalIntegration.typebotRestartMessage
        }
      };
    }

    console.log(`❌ Nenhuma integração Typebot encontrada para ticket ${ticket.id}`);
    return null;

  } catch (error) {
    console.error('Erro ao buscar integração Typebot:', error);
    return null;
  }
}

/**
 * Busca integração específica da sessão
 */
async function getSessionIntegrationBySessionId(sessionId, companyId) {
  try {
    const sessionIntegration = await SessionIntegrations.findOne({
      where: {
        sessionId,
        companyId,
        isActive: true
      },
      include: [
        {
          model: Integration,
          as: 'integration',
          where: {
            type: 'typebot',
            isActive: true
          }
        }
      ]
    });

    if (sessionIntegration) {
      console.log(`🎯 Encontrada integração da sessão ${sessionId}: ${sessionIntegration.id}`);
      return {
        id: sessionIntegration.id,
        active: sessionIntegration.isActive,
        triggerOnlyWithoutQueue: sessionIntegration.triggerOnlyWithoutQueue,
        urlN8N: sessionIntegration.urlN8N,
        typebotSlug: sessionIntegration.typebotSlug,
        typebotExpires: sessionIntegration.typebotExpires,
        typebotKeywordFinish: sessionIntegration.typebotKeywordFinish,
        typebotKeywordRestart: sessionIntegration.typebotKeywordRestart,
        typebotUnknownMessage: sessionIntegration.typebotUnknownMessage,
        typebotDelayMessage: sessionIntegration.typebotDelayMessage,
        typebotRestartMessage: sessionIntegration.typebotRestartMessage,
        integration: sessionIntegration.integration
      };
    }

    console.log(`❌ Nenhuma integração ativa encontrada para sessão ${sessionId}`);
    return null;
  } catch (error) {
    console.error('Erro ao buscar integração da sessão:', error);
    return null;
  }
}

/**
 * Verifica se o ticket deve usar integração Typebot
 */
export function shouldUseTypebotIntegration(ticket) {
  // Não usar Typebot se:
  // - Ticket está fechado
  // - Ticket foi aceito manualmente (chatStatus = 'accepted')
  
  console.log(`🤖 [SHOULD-USE] Verificando ticket ${ticket.id}: status=${ticket.status}, chatStatus=${ticket.chatStatus}, assignedUserId=${ticket.assignedUserId}, isBot=${ticket.isBot}`);
  
  if (ticket.status === 'closed') {
    console.log(`🚫 Ticket ${ticket.id} está fechado, não usar Typebot`);
    return false;
  }

  // Se já foi aceito manualmente pelo atendente, não usar Typebot
  if (ticket.chatStatus === 'accepted') {
    console.log(`🚫 Ticket ${ticket.id} já foi aceito manualmente (chatStatus: accepted), não usar Typebot`);
    return false;
  }

  // Se já está usando bot, permitir continuar
  if (ticket.isBot || ticket.useIntegration) {
    console.log(`✅ Ticket ${ticket.id} já está usando integração, continuar processamento`);
    return true;
  }

  // Se o chatStatus é 'accepted', significa que foi aceito manualmente pelo atendente
  if (ticket.chatStatus === 'accepted') {
    console.log(`🚫 Ticket ${ticket.id} foi aceito manualmente por atendente (chatStatus=accepted), não usar Typebot`);
    return false;
  }

  // Permitir Typebot para tickets em status 'waiting' (mesmo que tenham assignedUserId)
  if (ticket.chatStatus === 'waiting') {
    console.log(`✅ Ticket ${ticket.id} está em ${ticket.chatStatus}, pode usar Typebot`);
    return true;
  }

  console.log(`❓ Ticket ${ticket.id} em estado indefinido (chatStatus=${ticket.chatStatus}), não usar Typebot`);
  return false;
}

/**
 * Determina quando parar a integração Typebot
 */
export function shouldStopTypebotIntegration(ticket, integrationType) {
  // Parar integração quando:
  // - Ticket for aceito manualmente por um atendente (chatStatus=accepted)
  // - Ticket for fechado
  // - Para integrações de sessão: quando ticket for direcionado para fila (se configurado)
  
  if (ticket.status === 'closed') {
    return { stop: true, reason: 'Ticket foi fechado' };
  }

  if (ticket.chatStatus === 'accepted') {
    return { stop: true, reason: 'Ticket foi aceito manualmente pelo atendente' };
  }

  // Não parar apenas por ter assignedUserId, pois pode ser auto-assignment
  // Comentado: if (ticket.userId && ticket.status === 'open') {
  //   return { stop: true, reason: 'Ticket foi aceito por um atendente' };
  // }

  // Para integrações de sessão com triggerOnlyWithoutQueue
  if (integrationType === 'session' && ticket.queueId) {
    // Verificar se a integração da sessão está configurada para parar quando tem fila
    // Por enquanto assumimos que sim, depois implementamos a verificação completa
    return { stop: true, reason: 'Ticket foi direcionado para uma fila' };
  }

  return { stop: false };
}
