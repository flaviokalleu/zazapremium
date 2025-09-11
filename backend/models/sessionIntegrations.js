import { DataTypes } from 'sequelize';
import sequelize from '../services/sequelize.js';

const SessionIntegrations = sequelize.define('SessionIntegrations', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  sessionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'sessions', key: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  integrationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'integrations', key: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'companies', key: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  urlN8N: {
    type: DataTypes.STRING,
    allowNull: true
  },
  typebotSlug: {
    type: DataTypes.STRING,
    allowNull: true
  },
  typebotExpires: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  typebotKeywordFinish: {
    type: DataTypes.STRING,
    allowNull: true
  },
  typebotKeywordRestart: {
    type: DataTypes.STRING,
    allowNull: true
  },
  typebotUnknownMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  typebotDelayMessage: {
    type: DataTypes.INTEGER,
    defaultValue: 1000
  },
  typebotRestartMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  triggerOnlyWithoutQueue: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Se true, só funciona quando ticket não tem fila. Se false, funciona sempre.'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'session_integrations',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['sessionId', 'companyId'],
      name: 'session_integrations_unique_session_company'
    }
  ]
});

export default SessionIntegrations;
