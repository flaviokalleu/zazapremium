import { DataTypes } from 'sequelize';
import sequelize from '../services/sequelize.js';

const Ticket = sequelize.define('Ticket', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  uid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true,
    comment: 'UID único para acesso direto ao ticket via link'
  },
  sessionId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'sessions',
      key: 'id',
    },
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'companies',
      key: 'id',
    },
  },
  contactId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'contacts',
      key: 'id',
    },
    comment: 'ID do contato vinculado ao ticket'
  },
  queueId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'queues',
      key: 'id',
    },
    comment: 'ID da fila vinculada ao ticket'
  },
  assignedUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
    comment: 'ID do usuário responsável pelo ticket'
  },
  contact: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  contactName: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Nome amigável do contato para uso em integrações (Typebot, templates)'
  },
  lastMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  unreadCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'open',
  },
  channel: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'whatsapp',
    comment: 'Canal de origem da conversa (whatsapp, instagram, facebook)'
  },
  chatStatus: {
    type: DataTypes.ENUM('waiting', 'accepted', 'resolved', 'closed'),
    defaultValue: 'waiting',
    allowNull: false,
    comment: 'Status do chat: aguardando, aceito, resolvido ou fechado'
  },
  protocol: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    comment: 'Número de protocolo gerado ao fechar o ticket'
  },
  npsScore: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Pontuação NPS fornecida pelo cliente (0-10)'
  },
  npsUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' },
    comment: 'Usuário responsável no momento da captura do NPS'
  },
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
    defaultValue: 'normal',
    allowNull: false,
    comment: 'Prioridade do ticket'
  },
  isBot: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: 'Se o ticket está sendo atendido por bot'
  },
  // Campos específicos para integração Typebot
  typebotSessionId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'ID da sessão do Typebot'
  },
  typebotStatus: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Status da integração com Typebot'
  },
  typebotSessionTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp da última sessão do Typebot'
  },
  useIntegration: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Se o ticket está usando integração'
  },
  integrationId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'integrations',
      key: 'id',
    },
    comment: 'ID da integração ativa para este ticket'
  },
  typebotPendingVariable: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Próxima variável (variableId) aguardando input do usuário'
  },
  typebotPendingVariableAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp em que a variável pendente foi definida'
  },
}, {
  tableName: 'tickets',
  timestamps: true,
  hooks: {
    beforeCreate: async (ticket) => {
      // Se companyId não foi fornecido, buscar da sessão
      if (!ticket.companyId && ticket.sessionId) {
        const { Session } = await import('./session.js');
        const session = await Session.default.findByPk(ticket.sessionId);
        if (session) {
          ticket.companyId = session.companyId;
        }
      }
    }
  }
});

export default Ticket;
