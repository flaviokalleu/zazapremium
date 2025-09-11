import { DataTypes } from 'sequelize';
import sequelize from '../services/sequelize.js';

const QueueIntegrations = sequelize.define('QueueIntegrations', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  queueId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'queues', key: 'id' },
  },
  integrationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'integrations', key: 'id' },
  },
  companyId: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    references: { model: 'companies', key: 'id' }
  },
  // Campos específicos para Typebot (duplicados aqui para facilitar acesso)
  urlN8N: { type: DataTypes.STRING, allowNull: true },
  typebotSlug: { type: DataTypes.STRING, allowNull: true },
  typebotExpires: { type: DataTypes.INTEGER, defaultValue: 0 },
  typebotKeywordFinish: { type: DataTypes.STRING, allowNull: true },
  typebotKeywordRestart: { type: DataTypes.STRING, allowNull: true },
  typebotUnknownMessage: { type: DataTypes.STRING, allowNull: true },
  typebotDelayMessage: { type: DataTypes.INTEGER, defaultValue: 1000 },
  typebotRestartMessage: { type: DataTypes.STRING, allowNull: true },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'queue_integrations',
  timestamps: true,
});

QueueIntegrations.associate = (models) => {
  QueueIntegrations.belongsTo(models.Queue, { foreignKey: 'queueId', as: 'queue' });
  QueueIntegrations.belongsTo(models.Integration, { foreignKey: 'integrationId', as: 'integration' });
  QueueIntegrations.belongsTo(models.Company, { foreignKey: 'companyId', as: 'company' });
};

export default QueueIntegrations;
