'use strict';

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  // Buscar a empresa master para usar como padrão
  const [companies] = await queryInterface.sequelize.query(`
    SELECT id FROM companies WHERE email = 'admin@zazap.com' LIMIT 1;
  `);

  if (companies.length === 0) {
    throw new Error('Empresa master não encontrada. Execute primeiro a migração de companies.');
  }

  const companyId = companies[0].id;

  // Tabelas que precisam de companyId
  const tables = [
    'sessions',
    'tickets', 
    'queues',
    'contacts',
    'quickreplies',
    'integrations',
    'tags',
    'campaigns',
    'schedules'
  ];

  for (const table of tables) {
    try {
      // Verificar se a coluna já existe
      const [columns] = await queryInterface.sequelize.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = '${table}' AND column_name = 'companyId';
      `);

      if (columns.length === 0) {
        // Adicionar coluna companyId
        await queryInterface.addColumn(table, 'companyId', {
          type: Sequelize.INTEGER,
          allowNull: true, // Inicialmente null
          references: {
            model: 'companies',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        });

        // Atualizar registros existentes com a empresa master
        await queryInterface.sequelize.query(`
          UPDATE "${table}" SET "companyId" = ${companyId} WHERE "companyId" IS NULL;
        `);

        // Tornar a coluna obrigatória
        await queryInterface.changeColumn(table, 'companyId', {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'companies',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        });

        // Adicionar índice
        await queryInterface.addIndex(table, ['companyId'], {
          name: `${table}_company_id_index`
        });

        console.log(`✅ CompanyId adicionado à tabela ${table}`);
      } else {
        console.log(`⚠️ CompanyId já existe na tabela ${table}`);
      }
    } catch (error) {
      console.error(`❌ Erro ao processar tabela ${table}:`, error.message);
      // Continuar com as outras tabelas mesmo se uma falhar
    }
  }
}

export async function down(queryInterface, Sequelize) {
  const tables = [
    'schedules',
    'campaigns', 
    'tags',
    'integrations',
    'quickreplies',
    'contacts',
    'queues',
    'tickets',
    'sessions'
  ];

  for (const table of tables) {
    try {
      // Remover índice
      await queryInterface.removeIndex(table, `${table}_company_id_index`);
      
      // Remover coluna
      await queryInterface.removeColumn(table, 'companyId');
      
      console.log(`✅ CompanyId removido da tabela ${table}`);
    } catch (error) {
      console.error(`❌ Erro ao remover companyId da tabela ${table}:`, error.message);
    }
  }
}
