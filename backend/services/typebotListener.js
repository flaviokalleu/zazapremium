import axios from 'axios';

// Importar modelos necessários via import dinâmico
let TicketMessage = null;
let Session = null;
// Set para evitar processamento concorrente do mesmo ticket
const processingTickets = new Set();

// Função de delay para aguardar entre mensagens
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Função para extrair o corpo da mensagem
function getBodyMessage(msg) {
    if (!msg) return '';
    
    if (msg.message?.conversation) {
        return msg.message.conversation;
    }
    
    if (msg.message?.extendedTextMessage?.text) {
        return msg.message.extendedTextMessage.text;
    }
    
    if (typeof msg === 'string') {
        return msg;
    }
    
    return '';
}

const typebotListener = async (ticket, sessionId, messageContent, integrationConfig, attachments) => {
    if (processingTickets.has(ticket.id)) {
        console.log(`⏳ [TYPEBOT] Ticket ${ticket.id} já em processamento, ignorando chamada concorrente`);
        return false;
    }
    processingTickets.add(ticket.id);
    try {
        console.log(`🤖 [TYPEBOT] Processando mensagem para ticket #${ticket.id}`);
        
        if (!integrationConfig) {
            console.log(`❌ [TYPEBOT] Nenhuma configuração de integração fornecida`);
            return false;
        }

        const { 
            urlN8N: url,
            typebotSlug,
            typebotExpires = 60,
            typebotKeywordFinish = 'sair',
            typebotKeywordRestart = 'restart',
            typebotUnknownMessage = 'Não entendi. Pode repetir?',
            typebotDelayMessage = 1000,
            typebotRestartMessage = 'Conversa reiniciada!'
        } = integrationConfig;
        
        console.log(`🤖 [TYPEBOT-CONFIG] URL: ${url}`);
        console.log(`🤖 [TYPEBOT-CONFIG] Slug: ${typebotSlug}`);
        console.log(`🤖 [TYPEBOT-CONFIG] MessageContent: ${messageContent}`);

        // Validar configurações obrigatórias
        if (!url || !typebotSlug || url.trim() === '' || typebotSlug.trim() === '') {
            console.error(`❌ [TYPEBOT] Configuração inválida - URL: "${url}", Slug: "${typebotSlug}"`);
            return false;
        }

        // Validar formato da URL
        try {
            new URL(url);
        } catch (error) {
            console.error(`❌ [TYPEBOT] URL inválida: ${url}`);
            return false;
        }
        
        console.log(`✅ [TYPEBOT] Configuração válida - URL: ${url}, Slug: ${typebotSlug}`);

        // Verificar se é comando de finalizar
        if (messageContent.toLowerCase().trim() === typebotKeywordFinish.toLowerCase().trim()) {
            console.log(`🔚 [TYPEBOT] Comando de finalizar recebido`);
            await ticket.update({
                isBot: false,
                useIntegration: false,
                typebotSessionId: null,
                typebotStatus: false
            });
            
            // Salvar mensagem de sistema
            await TicketMessage.create({
                ticketId: ticket.id,
                sender: 'system',
                content: 'Atendimento via bot finalizado.',
                timestamp: new Date(),
                messageType: 'text',
                channel: 'system'
            });
            
            return true;
        }

        // Verificar se é comando de reiniciar
        if (messageContent.toLowerCase().trim() === typebotKeywordRestart.toLowerCase().trim()) {
            console.log(`🔄 [TYPEBOT] Comando de reiniciar recebido`);
            await ticket.update({
                typebotSessionId: null,
                isBot: true
            });
            
            // Enviar mensagem de reinício via sistema de mensagens
            await sendTypebotResponse(ticket, sessionId, typebotRestartMessage);
            return true;
        }

        // Verificar se a sessão expirou
        if (ticket.typebotSessionTime && typebotExpires > 0) {
            const now = new Date();
            const sessionTime = new Date(ticket.typebotSessionTime);
            const diffMinutes = (now - sessionTime) / (1000 * 60);
            
            if (diffMinutes > typebotExpires) {
                console.log(`⏰ [TYPEBOT] Sessão expirada após ${diffMinutes} minutos`);
                await ticket.update({
                    typebotSessionId: null,
                    typebotSessionTime: null
                });
            }
        }

        // Criar ou reutilizar sessão
        let currentSessionId = ticket.typebotSessionId;
        if (!currentSessionId) {
            console.log(`🆕 [TYPEBOT] Criando nova sessão para ticket #${ticket.id}`);
            try {
                const creation = await createTypebotSession(url, typebotSlug, ticket, messageContent);
                currentSessionId = creation?.sessionId;
                if (!currentSessionId) {
                    console.log(`❌ [TYPEBOT] Falha ao criar sessão`);
                    return false;
                }
                await ticket.update({
                    typebotSessionId: currentSessionId,
                    typebotStatus: true,
                    useIntegration: true,
                    isBot: true,
                    typebotSessionTime: new Date()
                });
                console.log(`✅ [TYPEBOT] Nova sessão criada: ${currentSessionId}`);
                if (creation.messages?.length) {
                    console.log(`📨 [TYPEBOT] ${creation.messages.length} mensagens recebidas no startChat`);
                    for (let i = 0; i < creation.messages.length; i++) {
                        const m = creation.messages[i];
                        console.log(`📝 [TYPEBOT] Processando mensagem inicial ${i+1}/${creation.messages.length}:`, m);
                        await processTypebotMessage(ticket, sessionId, m, integrationConfig);
                        if (typebotDelayMessage > 0 && i < creation.messages.length - 1) {
                            await delay(typebotDelayMessage);
                        }
                    }
                    console.log(`✅ [TYPEBOT] Processamento concluído para ticket #${ticket.id}`);
                    return true; // evita continueChat duplicado
                }
            } catch (errorCreate) {
                console.error(`❌ [TYPEBOT] Erro ao criar sessão:`, errorCreate.message);
                return false;
            }
        } else {
            console.log(`♻️ [TYPEBOT] Usando sessão existente: ${currentSessionId}`);
        }

        console.log(`📤 [TYPEBOT] Enviando mensagem "${messageContent}" para sessão ${currentSessionId}`);
        const sendOpts = {};
        if (integrationConfig?.typebotToken) sendOpts.token = integrationConfig.typebotToken;

        // Se houver arquivos pendentes para enviar (ex: anexos capturados antes de continuar), aceitar array em ticket.tempPendingFiles (convencional)
        if (ticket.tempPendingFiles && Array.isArray(ticket.tempPendingFiles) && ticket.tempPendingFiles.length) {
            sendOpts.attachedFileUrls = ticket.tempPendingFiles.slice(0, 10); // limitar
        }

        if (attachments && attachments.length) {
            sendOpts.attachedFileUrls = attachments.map(a => a.url).filter(Boolean).slice(0, 10);
        }
        let response = await sendToTypebot(url, currentSessionId, messageContent, sendOpts);
        if (response?.sessionExpired) {
            console.log(`🔄 [TYPEBOT] Sessão ${currentSessionId} expirada. Recriando...`);
            try {
                const creation = await createTypebotSession(url, typebotSlug, ticket, messageContent);
                const newSessionId = creation?.sessionId;
                if (newSessionId) {
                    await ticket.update({ typebotSessionId: newSessionId, typebotSessionTime: new Date() });
                    console.log(`✅ [TYPEBOT] Nova sessão criada: ${newSessionId}`);
                    if (creation.messages?.length) {
                        console.log(`📨 [TYPEBOT] ${creation.messages.length} mensagens (startChat após 404)`);
                        for (let i = 0; i < creation.messages.length; i++) {
                            const m = creation.messages[i];
                            console.log(`📝 [TYPEBOT] Processando mensagem inicial ${i+1}/${creation.messages.length}:`, m);
                            await processTypebotMessage(ticket, sessionId, m, integrationConfig);
                            if (typebotDelayMessage > 0 && i < creation.messages.length - 1) {
                                await delay(typebotDelayMessage);
                            }
                        }
                        console.log(`✅ [TYPEBOT] Processamento concluído para ticket #${ticket.id}`);
                        return true;
                    }
                } else {
                    console.log(`❌ [TYPEBOT] Falha ao recriar sessão`);
                }
            } catch (recreateErr) {
                console.error(`❌ [TYPEBOT] Erro ao recriar sessão:`, recreateErr.message);
            }
        }

        if (response?.input?.options?.variableId) {
            try {
                await ticket.update({
                    typebotPendingVariable: response.input.options.variableId,
                    typebotPendingVariableAt: new Date()
                });
                console.log(`🧩 [TYPEBOT] Aguardando input para variável: ${response.input.options.variableId}`);
            } catch (varErr) {
                console.warn('⚠️ [TYPEBOT] Falha ao salvar variável pendente:', varErr.message);
            }
        }

        if (response?.messages?.length) {
            console.log(`📨 [TYPEBOT] Recebidas ${response.messages.length} mensagens do Typebot`);
            for (let i = 0; i < response.messages.length; i++) {
                const m = response.messages[i];
                console.log(`📝 [TYPEBOT] Processando mensagem ${i+1}/${response.messages.length}:`, m);
                await processTypebotMessage(ticket, sessionId, m, integrationConfig);
                if (typebotDelayMessage > 0 && i < response.messages.length - 1) {
                    console.log(`⏳ [TYPEBOT] Aguardando ${typebotDelayMessage}ms antes da próxima mensagem`);
                    await delay(typebotDelayMessage);
                }
            }
        } else {
            // Evitar mandar resposta "não entendi" imediatamente em passos de captura de input
            if (!global.__typebotEmptyCounts) global.__typebotEmptyCounts = new Map();
            const key = ticket.id;
            const prev = global.__typebotEmptyCounts.get(key) || 0;
            const next = prev + 1;
            global.__typebotEmptyCounts.set(key, next);
            console.log(`⚠️ [TYPEBOT] Resposta vazia (${next}) para ticket #${ticket.id}. Aguardando mais input antes de fallback.`);
            if (next >= 3) {
                console.log(`🟡 [TYPEBOT] Enviando fallback após ${next} respostas vazias`);
                await sendTypebotResponse(ticket, sessionId, typebotUnknownMessage);
                global.__typebotEmptyCounts.set(key, 0);
            }
        }

        console.log(`✅ [TYPEBOT] Processamento concluído para ticket #${ticket.id}`);
        return true;

    } catch (error) {
        console.error('❌ [TYPEBOT] Erro no processamento:', error.message);
        console.error('❌ [TYPEBOT] Stack trace:', error.stack);
        
        // Resetar sessão em caso de erro
        try {
            await ticket.update({
                typebotSessionId: null,
                typebotStatus: false
            });
        } catch (updateError) {
            console.error('❌ [TYPEBOT] Erro ao resetar sessão:', updateError.message);
        }
        
        return false;
    } finally {
        processingTickets.delete(ticket.id);
    }
};

// Função para criar sessão no Typebot
async function createTypebotSession(url, typebotSlug, ticket, initialMessage) {
    try {
        console.log(`🚀 [TYPEBOT] Criando nova sessão...`);
        
        const sessionData = {
            isStreamEnabled: true,
            message: initialMessage,
            prefilledVariables: {
                ticketId: ticket.id.toString(),
                contact: ticket.contact || '',
                sessionId: ticket.sessionId?.toString() || '',
                contactName: ticket.contactName || ticket.contact || '',
                contactNumber: (ticket.contact || '').split('@')[0]
            },
            textBubbleContentFormat: 'richText'
        };

        const endpoint = `${url}/api/v1/typebots/${typebotSlug}/startChat`;
        console.log(`📡 [TYPEBOT] Endpoint: ${endpoint}`);
        console.log(`📊 [TYPEBOT] Dados da sessão:`, sessionData);

        const response = await axios.post(endpoint, sessionData, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 10000
        });

        console.log(`✅ [TYPEBOT] Sessão criada com sucesso`);
        console.log(`📋 [TYPEBOT] Response status: ${response.status}`);
        console.log(`📋 [TYPEBOT] Response data:`, response.data);

        return {
            sessionId: response.data.sessionId,
            messages: response.data.messages || [],
            input: response.data.input || null,
            raw: response.data
        };
    } catch (error) {
        console.error('❌ [TYPEBOT] Erro ao criar sessão:', error.message);
        if (error.response) {
            console.error('📊 [TYPEBOT] Response status:', error.response.status);
            console.error('📊 [TYPEBOT] Response data:', error.response.data);
        }
        throw error;
    }
}

// Função para enviar mensagem ao Typebot
async function sendToTypebot(url, sessionId, message, options = {}) {
    try {
        const endpoint = `${url}/api/v1/sessions/${sessionId}/continueChat`;
        console.log(`📤 [TYPEBOT] Enviando mensagem...`);
        console.log(`📡 [TYPEBOT] Endpoint: ${endpoint}`);
        console.log(`📊 [TYPEBOT] Mensagem (raw):`, message);

        let payload;
        if (typeof message === 'object' && message?.message) {
            payload = { ...message, textBubbleContentFormat: message.textBubbleContentFormat || 'richText' };
        } else if (typeof message === 'object' && message.type) {
            payload = { message, textBubbleContentFormat: 'richText' };
        } else {
            payload = {
                message: {
                    type: 'text',
                    text: String(message ?? ''),
                    metadata: options.replyId ? { replyId: options.replyId } : undefined,
                    attachedFileUrls: options.attachedFileUrls || []
                },
                textBubbleContentFormat: 'richText'
            };
        }

        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        if (options.token) headers['Authorization'] = `Bearer ${options.token}`;

        // Streaming opcional: se options.stream for true, usar responseType: 'stream' e agregar
        if (options.stream) {
            const resp = await axios.post(endpoint, payload, { headers, timeout: 30000, responseType: 'stream' });
            let accumulated = '';
            await new Promise((resolve, reject) => {
                resp.data.on('data', chunk => {
                    const text = chunk.toString();
                    accumulated += text;
                    try {
                        const { emitToAll } = require('./socket.js');
                        emitToAll('typebot-stream-chunk', { sessionId, ticketId: sessionId, chunk: text });
                    } catch {}
                });
                resp.data.on('end', resolve);
                resp.data.on('error', reject);
            });
            try {
                const jsonMatch = accumulated.trim().match(/\{[\s\S]*\}$/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    console.log('🌀 [TYPEBOT-STREAM] Resposta agregada parseada.');
                    return parsed;
                }
            } catch (e) {
                console.warn('⚠️ [TYPEBOT-STREAM] Falha ao parsear JSON final:', e.message);
            }
            console.log('🌀 [TYPEBOT-STREAM] Retornando conteúdo bruto agregado.');
            return { rawStream: accumulated };
        }

        const response = await axios.post(endpoint, payload, { headers, timeout: 15000 });

        console.log(`✅ [TYPEBOT] Mensagem enviada com sucesso`);
        console.log(`📋 [TYPEBOT] Response status: ${response.status}`);
        console.log(`📋 [TYPEBOT] Response data:`, response.data);

        return response.data;
    } catch (error) {
        console.error('❌ [TYPEBOT] Erro ao enviar mensagem:', error.message);
        if (error.response) {
            console.error('📊 [TYPEBOT] Response status:', error.response.status);
            console.error('📊 [TYPEBOT] Response data:', error.response.data);
            if (error.response.status === 404) {
                return { sessionExpired: true, error: error.response.data };
            }
        }
        return null;
    }
}

// Função para processar mensagem do Typebot
async function processTypebotMessage(ticket, sessionId, message, config) {
    try {
        if (message.type === 'text') {
            let content = '';
            
            // Processar rich text do Typebot
            if (message.content?.richText) {
                content = extractTextFromRichText(message.content.richText);
            } else if (message.content?.text) {
                content = message.content.text;
            } else {
                content = JSON.stringify(message.content);
            }

            // Verificar se é um comando especial (começando com #)
            if (content.startsWith('#')) {
                // Suporte estendido: #{"vars":{"nome":"Flavio"}}
                try {
                    const parsed = JSON.parse(content.substring(1));
                    if (parsed.vars && typeof parsed.vars === 'object') {
                        await applyTypebotVariables(ticket, parsed.vars);
                    }
                } catch {/* silencioso */}
                await processTypebotCommand(ticket, content);
                return;
            }

            // Enviar resposta
            await sendTypebotResponse(ticket, sessionId, content);
        } else if (message.type === 'image') {
            // Suporte inicial: apenas logar e enviar URL se existir
            const url = message.content?.url || message.url;
            if (url) {
                await sendTypebotResponse(ticket, sessionId, `📷 ${url}`);
            }
        }
        
        // Adicionar suporte para outros tipos de mídia no futuro
        // if (message.type === 'image') { ... }
        // if (message.type === 'audio') { ... }
        
    } catch (error) {
        console.error('❌ [TYPEBOT] Erro ao processar mensagem:', error);
    }
}

// Função para extrair texto de rich text
function extractTextFromRichText(richText) {
    let result = '';
    
    if (Array.isArray(richText)) {
        for (const block of richText) {
            if (block.children) {
                for (const child of block.children) {
                    if (child.text) {
                        let text = child.text;
                        
                        // Aplicar formatação
                        if (child.bold) text = `*${text}*`;
                        if (child.italic) text = `_${text}_`;
                        if (child.underline) text = `~${text}~`;
                        
                        result += text;
                    }
                }
            }
            result += '\n';
        }
    }
    
    return result.trim();
}

// Função para processar comandos especiais do Typebot
async function processTypebotCommand(ticket, command) {
    try {
        const commandData = JSON.parse(command.substring(1)); // Remove o #
        
        if (commandData.stopBot) {
            await ticket.update({
                isBot: false,
                useIntegration: false,
                typebotStatus: false
            });
            console.log(`🛑 [TYPEBOT] Bot desabilitado para ticket #${ticket.id}`);
        }
        
        if (commandData.queueId) {
            await ticket.update({
                queueId: commandData.queueId,
                isBot: false,
                useIntegration: false
            });
            console.log(`📋 [TYPEBOT] Ticket #${ticket.id} movido para fila ${commandData.queueId}`);
        }
        
        if (commandData.userId) {
            await ticket.update({
                assignedUserId: commandData.userId,
                chatStatus: 'accepted',
                isBot: false,
                useIntegration: false
            });
            console.log(`👤 [TYPEBOT] Ticket #${ticket.id} atribuído ao usuário ${commandData.userId}`);
        }
        
    } catch (error) {
        console.error('❌ [TYPEBOT] Erro ao processar comando:', error);
    }
}

// Função para enviar resposta do Typebot
async function sendTypebotResponse(ticket, sessionId, content) {
    try {
        console.log(`📤 [TYPEBOT] Enviando resposta para ticket #${ticket.id}: "${content}"`);
        
        // Importar modelos se necessário
        if (!TicketMessage) {
            try {
                const models = await import('../models/index.js');
                TicketMessage = models.default?.TicketMessage || models.TicketMessage;
                Session = models.default?.Session || models.Session;
                
                // Fallback para importação individual se necessário
                if (!TicketMessage) {
                    const ticketMessageModel = await import('../models/ticketMessage.js');
                    TicketMessage = ticketMessageModel.default;
                }
                
                if (!Session) {
                    const sessionModel = await import('../models/session.js');
                    Session = sessionModel.default;
                }
                
                console.log(`📦 [TYPEBOT] Modelos carregados - TicketMessage: ${!!TicketMessage}, Session: ${!!Session}`);
            } catch (error) {
                console.error(`❌ [TYPEBOT] Erro ao importar modelos:`, error.message);
                return;
            }
        }

        // Verificar se os modelos foram carregados
        if (!TicketMessage) {
            console.error(`❌ [TYPEBOT] TicketMessage não foi carregado corretamente`);
            return;
        }

        // Salvar mensagem no banco
        const savedMessage = await TicketMessage.create({
            ticketId: ticket.id,
            sender: 'bot',
            content: content,
            timestamp: new Date(),
            messageType: 'text',
            channel: 'typebot'
        });

        console.log(`💾 [TYPEBOT] Mensagem salva no banco: ID ${savedMessage.id}`);

        // Enviar via sistema de mensagens
        if (sessionId) {
            if (!Session) {
                console.error(`❌ [TYPEBOT] Session model não foi carregado`);
                return;
            }
            
            const session = await Session.findByPk(sessionId);
            
            if (session && session.whatsappId) {
                console.log(`📱 [TYPEBOT] Enviando via WhatsApp para ${session.whatsappId}`);
                
                try {
                    // Importar intelligentLibraryManager dinamicamente
                    const intelligentLibraryManagerModule = await import('./intelligentLibraryManager.js');
                    const intelligentLibraryManager = intelligentLibraryManagerModule.default || intelligentLibraryManagerModule;
                    
                    await intelligentLibraryManager.sendMessage(
                        session.whatsappId,
                        ticket.contact || `${ticket.contactNumber}@c.us`,
                        content
                    );
                    
                    console.log(`✅ [TYPEBOT] Resposta enviada com sucesso via WhatsApp`);
                } catch (sendError) {
                    console.error(`❌ [TYPEBOT] Erro ao enviar via WhatsApp:`, sendError.message);
                }
            } else {
                console.log(`⚠️ [TYPEBOT] Sessão não encontrada ou sem whatsappId - session:`, session ? `ID ${session.id}` : 'null');
            }
        } else {
            console.log(`⚠️ [TYPEBOT] sessionId não fornecido`);
        }
        
    } catch (error) {
        console.error('❌ [TYPEBOT] Erro ao enviar resposta:', error);
    }
}

export default typebotListener;

// Aplicar variáveis capturadas do fluxo Typebot ao ticket/contato
async function applyTypebotVariables(ticket, vars) {
    try {
        const models = await import('../models/index.js');
        const { Contact } = models.default || models;
        let changedTicket = false;
        let changedContact = false;

        // Carregar contato
        let contact = null;
        if (ticket.contactId && Contact) {
            contact = await Contact.findByPk(ticket.contactId);
        }

        for (const [key, value] of Object.entries(vars)) {
            const v = typeof value === 'string' ? value.trim() : value;
            if (!v) continue;
            switch (key.toLowerCase()) {
                case 'nome':
                case 'name':
                case 'contactname':
                    if (contact && contact.name !== v) { await contact.update({ name: v }); changedContact = true; }
                    if (ticket.contactName !== v) { await ticket.update({ contactName: v }); changedTicket = true; }
                    break;
                case 'email':
                    if (contact && contact.email !== v) { try { await contact.update({ email: v }); changedContact = true; } catch {} }
                    break;
                case 'empresa':
                case 'company':
                    if (contact && contact.company !== v) { try { await contact.update({ company: v }); changedContact = true; } catch {} }
                    break;
                default:
                    // Campos adicionais podem ser ignorados ou logados
                    console.log(`ℹ️ [TYPEBOT-VARS] Variável ignorada (${key})`);
            }
        }

        if (changedTicket || changedContact) {
            console.log(`✅ [TYPEBOT-VARS] Variáveis aplicadas (ticketChanged=${changedTicket} contactChanged=${changedContact})`);
        }
    } catch (e) {
        console.warn('⚠️ [TYPEBOT-VARS] Falha ao aplicar variáveis:', e.message);
    }
}
