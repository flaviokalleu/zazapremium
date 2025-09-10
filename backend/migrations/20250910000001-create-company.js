'use strict';

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('companies', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    phone: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    plan: {
      type: Sequelize.ENUM('basic', 'premium', 'unlimited'),
      allowNull: false,
      defaultValue: 'basic',
    },
    maxUsers: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 5,
    },
    maxQueues: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 3,
    },
    isActive: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
  });

  // Adicionar índices
  await queryInterface.addIndex('companies', ['email'], {
    unique: true,
    name: 'companies_email_unique'
  });
  
  await queryInterface.addIndex('companies', ['isActive'], {
    name: 'companies_is_active_index'
  });
  
  await queryInterface.addIndex('companies', ['plan'], {
    name: 'companies_plan_index'
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('companies');
}
