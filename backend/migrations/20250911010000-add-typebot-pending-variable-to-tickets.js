export default {
  up: async (queryInterface, Sequelize) => {
    const table = 'tickets';
    const desc = await queryInterface.describeTable(table);
    if (!desc.typebotPendingVariable) {
      await queryInterface.addColumn(table, 'typebotPendingVariable', {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Próxima variável aguardando input do usuário'
      });
    }
    if (!desc.typebotPendingVariableAt) {
      await queryInterface.addColumn(table, 'typebotPendingVariableAt', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp da definição da variável pendente'
      });
    }
  },
  down: async (queryInterface) => {
    const table = 'tickets';
    const desc = await queryInterface.describeTable(table);
    if (desc.typebotPendingVariable) {
      await queryInterface.removeColumn(table, 'typebotPendingVariable');
    }
    if (desc.typebotPendingVariableAt) {
      await queryInterface.removeColumn(table, 'typebotPendingVariableAt');
    }
  }
};