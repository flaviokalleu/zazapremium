export async function up(queryInterface, Sequelize) {
  // Adicionar companyId às tabelas principais
  const tables = [
    'sessions',
    'tickets', 
    'queues',
    'contacts',
    'QuickReplies',  // Nome correto da tabela
    'tags',
    'campaigns',
    'schedules'
  ];

  for (const tableName of tables) {
    try {
      // Verificar se a coluna já existe
      const tableDescription = await queryInterface.describeTable(tableName);
      
      if (!tableDescription.companyId) {
        // Adicionar coluna companyId
        await queryInterface.addColumn(tableName, 'companyId', {
          type: Sequelize.INTEGER,
          allowNull: true, // Inicialmente nullable para dados existentes
          references: {
            model: 'companies',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        });

        // Atualizar registros existentes para apontar para a empresa master (ID 1)
        await queryInterface.sequelize.query(
          `UPDATE "${tableName}" SET "companyId" = 1 WHERE "companyId" IS NULL`
        );

        // Tornar a coluna NOT NULL após atualizar os dados
        await queryInterface.changeColumn(tableName, 'companyId', {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'companies',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        });

        // Adicionar índice para performance
        await queryInterface.addIndex(tableName, ['companyId'], {
          name: `idx_${tableName}_company_id`
        });

        console.log(`✅ Adicionado companyId à tabela ${tableName}`);
      } else {
        console.log(`⚠️ Coluna companyId já existe na tabela ${tableName}`);
      }
    } catch (error) {
      console.log(`❌ Erro ao processar tabela ${tableName}:`, error.message);
    }
  }
}

export async function down(queryInterface, Sequelize) {
  const tables = [
    'sessions',
    'tickets',
    'queues', 
    'contacts',
    'QuickReplies',  // Nome correto da tabela
    'tags',
    'campaigns',
    'schedules'
  ];

  for (const tableName of tables) {
    try {
      // Remover índice
      await queryInterface.removeIndex(tableName, `idx_${tableName}_company_id`);
      
      // Remover coluna
      await queryInterface.removeColumn(tableName, 'companyId');
      
      console.log(`✅ Removido companyId da tabela ${tableName}`);
    } catch (error) {
      console.log(`❌ Erro ao remover companyId da tabela ${tableName}:`, error.message);
    }
  }
}
