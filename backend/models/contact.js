import { DataTypes } from 'sequelize';
import sequelize from '../services/sequelize.js';

const Contact = sequelize.define('Contact', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  whatsappId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'ID do contato no WhatsApp (ex: 5511999999999@c.us)'
  },
  sessionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID da sessão WhatsApp'
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID da empresa'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Nome do contato no WhatsApp'
  },
  pushname: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Nome exibido do contato'
  },
  formattedNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Número formatado do contato'
  },
  profilePicUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'URL da foto do perfil'
  },
  isBlocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Se o contato está bloqueado'
  },
  isGroup: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Se é um grupo'
  },
  isWAContact: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Se é um contato válido do WhatsApp'
  },
  lastSeen: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Última vez que foi visto online'
  }
}, {
  tableName: 'contacts',
  indexes: [
    {
      fields: ['whatsappId']
    },
    {
      fields: ['sessionId']
    },
    {
      fields: ['companyId']
    },
    {
      unique: true,
      fields: ['whatsappId', 'sessionId'],
      name: 'contacts_whatsapp_session_unique'
    }
  ],
  hooks: {
    beforeCreate: async (contact) => {
      // Se companyId não foi fornecido, buscar da sessão
      if (!contact.companyId && contact.sessionId) {
        const { Session } = await import('./session.js');
        const session = await Session.default.findByPk(contact.sessionId);
        if (session) {
          contact.companyId = session.companyId;
        }
      }
    }
  }
});

export default Contact;
