export default {
  up: async (queryInterface, Sequelize) => {
    const table = 'ticket_messages';
    const desc = await queryInterface.describeTable(table);

    // Garantir coluna messageId existe
    if (!desc.messageId) {
      await queryInterface.addColumn(table, 'messageId', {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'ID externo único (Baileys/WWebJS) para deduplicação'
      });
    }

    // Criar índice único composto (ticketId, messageId) ignorando messageId null
    // Alguns dialetos não suportam partial index via queryInterface diretamente => usar SQL bruto para Postgres
    // Assumindo Postgres (multi-tenant). Se MySQL, o WHERE será ignorado então tratar colisões em app.
    try {
      await queryInterface.sequelize.query(
        'CREATE UNIQUE INDEX IF NOT EXISTS ticket_messages_ticketid_messageid_uq ON ticket_messages ("ticketId", "messageId") WHERE "messageId" IS NOT NULL;'
      );
    } catch (e) {
      console.warn('⚠️  Falha ao criar índice único parcial (possível dialeto não suportado):', e.message);
    }
  },
  down: async (queryInterface) => {
    try {
      await queryInterface.sequelize.query('DROP INDEX IF EXISTS ticket_messages_ticketid_messageid_uq;');
    } catch {}
    // Não remover coluna messageId para evitar perda de dados históricos
  }
};