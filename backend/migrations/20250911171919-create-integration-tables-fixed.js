import { Sequelize } from 'sequelize';

export const up = async (queryInterface, Sequelize) => {
  // Adicionar campos específicos do Typebot na tabela integrations (só os que faltam)
  const integrationColumns = await queryInterface.describeTable('integrations');
  
  if (!integrationColumns.urlN8N) {
    await queryInterface.addColumn('integrations', 'urlN8N', {
      type: Sequelize.STRING,
      allowNull: true
    });
  }

  if (!integrationColumns.typebotSlug) {
    await queryInterface.addColumn('integrations', 'typebotSlug', {
      type: Sequelize.STRING,
      allowNull: true
    });
  }

  if (!integrationColumns.typebotExpires) {
    await queryInterface.addColumn('integrations', 'typebotExpires', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });
  }

  if (!integrationColumns.typebotKeywordFinish) {
    await queryInterface.addColumn('integrations', 'typebotKeywordFinish', {
      type: Sequelize.STRING,
      allowNull: true
    });
  }

  if (!integrationColumns.typebotKeywordRestart) {
    await queryInterface.addColumn('integrations', 'typebotKeywordRestart', {
      type: Sequelize.STRING,
      allowNull: true
    });
  }

  if (!integrationColumns.typebotUnknownMessage) {
    await queryInterface.addColumn('integrations', 'typebotUnknownMessage', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  }

  if (!integrationColumns.typebotDelayMessage) {
    await queryInterface.addColumn('integrations', 'typebotDelayMessage', {
      type: Sequelize.INTEGER,
      defaultValue: 1000
    });
  }

  if (!integrationColumns.typebotRestartMessage) {
    await queryInterface.addColumn('integrations', 'typebotRestartMessage', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  }

  // Criar tabela queue_integrations
  await queryInterface.createTable('queue_integrations', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    queueId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'queues', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    integrationId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'integrations', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    companyId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'companies', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    urlN8N: {
      type: Sequelize.STRING,
      allowNull: true
    },
    typebotSlug: {
      type: Sequelize.STRING,
      allowNull: true
    },
    typebotExpires: {
      type: Sequelize.INTEGER,
      defaultValue: 0
    },
    typebotKeywordFinish: {
      type: Sequelize.STRING,
      allowNull: true
    },
    typebotKeywordRestart: {
      type: Sequelize.STRING,
      allowNull: true
    },
    typebotUnknownMessage: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    typebotDelayMessage: {
      type: Sequelize.INTEGER,
      defaultValue: 1000
    },
    typebotRestartMessage: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    active: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false
    }
  });

  // Adicionar campos específicos do Typebot nos tickets
  const ticketColumns = await queryInterface.describeTable('tickets');
  
  if (!ticketColumns.typebotSessionId) {
    await queryInterface.addColumn('tickets', 'typebotSessionId', {
      type: Sequelize.STRING,
      allowNull: true
    });
  }

  if (!ticketColumns.typebotStatus) {
    await queryInterface.addColumn('tickets', 'typebotStatus', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
  }

  if (!ticketColumns.typebotSessionTime) {
    await queryInterface.addColumn('tickets', 'typebotSessionTime', {
      type: Sequelize.DATE,
      allowNull: true
    });
  }

  if (!ticketColumns.useIntegration) {
    await queryInterface.addColumn('tickets', 'useIntegration', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
  }

  if (!ticketColumns.integrationId) {
    await queryInterface.addColumn('tickets', 'integrationId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'integrations', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  }

  if (!ticketColumns.isBot) {
    await queryInterface.addColumn('tickets', 'isBot', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
  }
};

export const down = async (queryInterface, Sequelize) => {
  // Remover campos dos tickets
  await queryInterface.removeColumn('tickets', 'typebotSessionId');
  await queryInterface.removeColumn('tickets', 'typebotStatus');
  await queryInterface.removeColumn('tickets', 'typebotSessionTime');
  await queryInterface.removeColumn('tickets', 'useIntegration');
  await queryInterface.removeColumn('tickets', 'integrationId');
  await queryInterface.removeColumn('tickets', 'isBot');

  // Remover tabela queue_integrations
  await queryInterface.dropTable('queue_integrations');

  // Remover campos das integrações
  await queryInterface.removeColumn('integrations', 'urlN8N');
  await queryInterface.removeColumn('integrations', 'typebotSlug');
  await queryInterface.removeColumn('integrations', 'typebotExpires');
  await queryInterface.removeColumn('integrations', 'typebotKeywordFinish');
  await queryInterface.removeColumn('integrations', 'typebotKeywordRestart');
  await queryInterface.removeColumn('integrations', 'typebotUnknownMessage');
  await queryInterface.removeColumn('integrations', 'typebotDelayMessage');
  await queryInterface.removeColumn('integrations', 'typebotRestartMessage');
};
