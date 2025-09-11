'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up (queryInterface, Sequelize) {
    // Verificar se a coluna 'active' existe antes de tentar renomear
    const tableDescription = await queryInterface.describeTable('session_integrations');
    
    if (tableDescription.active && !tableDescription.isActive) {
      // Renomear coluna 'active' para 'isActive'
      await queryInterface.renameColumn('session_integrations', 'active', 'isActive');
    } else if (!tableDescription.isActive) {
      // Se não existe nem 'active' nem 'isActive', criar 'isActive'
      await queryInterface.addColumn('session_integrations', 'isActive', {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      });
    }
  },

  async down (queryInterface, Sequelize) {
    // Reverter: renomear 'isActive' de volta para 'active'
    const tableDescription = await queryInterface.describeTable('session_integrations');
    
    if (tableDescription.isActive) {
      await queryInterface.renameColumn('session_integrations', 'isActive', 'active');
    }
  }
};
