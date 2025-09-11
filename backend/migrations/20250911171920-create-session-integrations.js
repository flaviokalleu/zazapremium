export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('session_integrations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      companyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'companies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      sessionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'sessions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      integrationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'integrations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      triggerOnlyWithoutQueue: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      // Campos específicos do Typebot
      urlN8N: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      typebotSlug: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      typebotExpires: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      },
      typebotKeywordFinish: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      typebotKeywordRestart: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      typebotUnknownMessage: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      typebotDelayMessage: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 1000
      },
      typebotRestartMessage: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Adicionar índices únicos para evitar duplicatas
    await queryInterface.addIndex('session_integrations', {
      fields: ['sessionId', 'integrationId', 'companyId'],
      unique: true,
      name: 'unique_session_integration_company'
    });

    // Adicionar índices para performance
    await queryInterface.addIndex('session_integrations', ['companyId']);
    await queryInterface.addIndex('session_integrations', ['sessionId']);
    await queryInterface.addIndex('session_integrations', ['integrationId']);
    await queryInterface.addIndex('session_integrations', ['isActive']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('session_integrations');
  }
};
