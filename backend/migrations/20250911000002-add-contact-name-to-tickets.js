export default {
  up: async (queryInterface, Sequelize) => {
    const table = 'tickets';
    const desc = await queryInterface.describeTable(table);
    if (!desc.contactName) {
      await queryInterface.addColumn(table, 'contactName', {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Nome amigável do contato para uso em integrações'
      });
    }
    try {
      await queryInterface.addIndex(table, ['contactName'], { name: 'tickets_contact_name_idx' });
    } catch (e) {
      console.warn('⚠️  Índice contactName já existe ou não pôde ser criado:', e.message);
    }
  },
  down: async (queryInterface) => {
    try { await queryInterface.removeIndex('tickets', 'tickets_contact_name_idx'); } catch {}
    const desc = await queryInterface.describeTable('tickets');
    if (desc.contactName) {
      await queryInterface.removeColumn('tickets', 'contactName');
    }
  }
};