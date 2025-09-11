import typebotListener from './typebotListener.js';
import { 
    getTypebotIntegrationForTicket, 
    shouldUseTypebotIntegration, 
    shouldStopTypebotIntegration 
} from './typebotIntegrationService.js';

/**
 * Função principal para processar mensagens com integração Typebot
 * Verifica automaticamente qual integração usar (fila, sessão ou geral)
 */
export async function processTypebotMessage({ wbot, msg, ticket, sessionId, attachments }) {
    try {
        // Evitar processamento duplicado da mesma mensagem: usar cache in-memory simples
        if (!global.__typebotProcessedMessages) {
            global.__typebotProcessedMessages = new Set();
        }
        const processedSet = global.__typebotProcessedMessages;
        let uniqueKey = null;
        if (msg) {
            // Para Baileys: msg.key?.id ou msg.id
            uniqueKey = msg.key?.id || msg.id || msg.messageId;
        }
        if (!uniqueKey && typeof msg === 'string') {
            uniqueKey = `str:${ticket.id}:${msg.substring(0,30)}`;
        }
        if (uniqueKey) {
            if (processedSet.has(uniqueKey)) {
                console.log(`🛑 [TYPEBOT-PROCESSOR] Mensagem já processada (${uniqueKey}), ignorando.`);
                return false;
            }
            processedSet.add(uniqueKey);
            // Limpeza simples para evitar crescimento infinito
            if (processedSet.size > 1000) {
                const first = processedSet.values().next().value;
                processedSet.delete(first);
            }
        }
        console.log(`🤖 [TYPEBOT-PROCESSOR-DEBUG] Parâmetros recebidos:`);
        console.log(`🤖 [TYPEBOT-PROCESSOR-DEBUG] - wbot:`, wbot ? 'presente' : 'null/undefined');
        console.log(`🤖 [TYPEBOT-PROCESSOR-DEBUG] - msg:`, msg ? 'presente' : 'null/undefined');
        if (msg) {
            console.log(`🤖 [TYPEBOT-PROCESSOR-DEBUG] - msg.key?.id:`, msg.key?.id);
            console.log(`🤖 [TYPEBOT-PROCESSOR-DEBUG] - msg.id:`, msg.id);
        }
        console.log(`🤖 [TYPEBOT-PROCESSOR-DEBUG] - ticket:`, ticket ? `ID: ${ticket.id}` : 'null/undefined');
        console.log(`🤖 [TYPEBOT-PROCESSOR-DEBUG] - sessionId:`, sessionId);
        
        if (!ticket) {
            console.error(`❌ [TYPEBOT-PROCESSOR] Ticket é null/undefined, cancelando processamento`);
            return false;
        }
        
        console.log(`🤖 Processando mensagem para integração Typebot - Ticket: ${ticket.id}, Sessão: ${sessionId}`);
        console.log(`🤖 [SHOULD-USE] Verificando ticket ${ticket.id}: status=${ticket.status}, chatStatus=${ticket.chatStatus}, assignedUserId=${ticket.assignedUserId}, isBot=${ticket.isBot}`);

        // Verificar se deve usar integração Typebot
        const shouldUse = shouldUseTypebotIntegration(ticket);
        console.log(`🤖 [SHOULD-USE] Resultado: ${shouldUse ? 'SIM' : 'NÃO'}`);
        
        if (!shouldUse) {
            console.log(`🚫 Ticket ${ticket.id} não deve usar integração Typebot`);
            return false;
        }

        // Buscar a integração apropriada
        console.log(`🔍 Buscando integração para ticket ${ticket.id}, fila: ${ticket.queueId}, sessão: ${sessionId}, empresa: ${ticket.companyId}`);
        const integrationResult = await getTypebotIntegrationForTicket(ticket, sessionId, ticket.companyId);
        
        if (!integrationResult) {
            console.log(`❌ Nenhuma integração Typebot encontrada para ticket ${ticket.id}`);
            return false;
        }

        const { type: integrationType, integration, config } = integrationResult;
        console.log(`✅ Integração encontrada - Tipo: ${integrationType}, ID: ${integration?.id}`);
        console.log(`📋 Config da integração:`, config);

        // Verificar se deve parar a integração
        const stopCheck = shouldStopTypebotIntegration(ticket, integrationType);
        if (stopCheck.stop) {
            console.log(`🛑 Parando integração Typebot para ticket ${ticket.id}: ${stopCheck.reason}`);
            
            // Atualizar ticket para indicar que não está mais usando bot
            if (ticket.isBot) {
                await ticket.update({ 
                    isBot: false, 
                    typebotStatus: false,
                    useIntegration: false
                });
            }
            
            return false;
        }

        // Marcar ticket como usando bot se ainda não estiver
        if (!ticket.isBot) {
            await ticket.update({ 
                isBot: true, 
                typebotStatus: true,
                useIntegration: true,
                integrationId: integration.id
            });
        }

        // Executar o listener do Typebot
        console.log(`✅ Executando integração Typebot tipo '${integrationType}' para ticket ${ticket.id}`);
        
        // Extrair conteúdo da mensagem
        let messageContent = '';
        if (msg && typeof msg === 'object') {
            // Para Baileys
            if (msg.message) {
                const { extractBaileysMessageContent } = await import('../utils/baileysMessageDetector.js');
                messageContent = extractBaileysMessageContent(msg);
            }
            // Para WWebJS
            else if (msg.body) {
                messageContent = msg.body;
            }
            // Fallback para string direta
            else if (typeof msg === 'string') {
                messageContent = msg;
            }
        } else if (typeof msg === 'string') {
            messageContent = msg;
        }
        
    await typebotListener(ticket, sessionId, messageContent, config, attachments);

        return true;

    } catch (error) {
        console.error('Erro ao processar mensagem com Typebot:', error);
        console.error('Error in processTypebotMessage:', error);
        return false;
    }
}

/**
 * Função para parar integração Typebot quando necessário
 */
export async function stopTypebotIntegration(ticket, reason = 'Manual stop') {
    try {
        console.log(`🛑 Parando integração Typebot para ticket ${ticket.id}: ${reason}`);

        if (ticket.isBot || ticket.typebotStatus || ticket.useIntegration) {
            await ticket.update({
                isBot: false,
                typebotStatus: false,
                useIntegration: false,
                typebotSessionId: null,
                typebotSessionTime: null
            });

            console.log(`✅ Integração Typebot parada para ticket ${ticket.id}`);
            return true;
        }

        return false;
    } catch (error) {
        console.error('Erro ao parar integração Typebot:', error);
        return false;
    }
}

/**
 * Função para verificar se ticket deve continuar usando Typebot
 */
export async function checkTypebotContinuation(ticket) {
    try {
        if (!ticket.isBot && !ticket.typebotStatus) {
            return false; // Já não está usando Typebot
        }

        const stopCheck = shouldStopTypebotIntegration(ticket, 'general'); // Tipo genérico para verificação
        
        if (stopCheck.stop) {
            await stopTypebotIntegration(ticket, stopCheck.reason);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Erro ao verificar continuação do Typebot:', error);
        return false;
    }
}
