'use strict';

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('users', 'isMasterAdmin', {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Identifica se o usuário é o administrador master do sistema'
  });

  // Criar índice para otimizar consultas
  await queryInterface.addIndex('users', ['isMasterAdmin'], {
    name: 'idx_users_is_master_admin'
  });
}

export async function down(queryInterface, Sequelize) {
  // Remover índice primeiro
  await queryInterface.removeIndex('users', 'idx_users_is_master_admin');
  
  // Remover coluna
  await queryInterface.removeColumn('users', 'isMasterAdmin');
}
