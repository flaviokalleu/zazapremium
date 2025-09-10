'use strict';

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  // Adicionar campo companyId à tabela users
  await queryInterface.addColumn('users', 'companyId', {
    type: Sequelize.INTEGER,
    allowNull: true, // Inicialmente null para dados existentes
    references: {
      model: 'companies',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  });

  // Adicionar índice para melhor performance
  await queryInterface.addIndex('users', ['companyId'], {
    name: 'users_company_id_index'
  });

  // Criar empresa padrão para dados existentes se não existir
  const [companies] = await queryInterface.sequelize.query(`
    SELECT id FROM companies WHERE email = 'admin@zazap.com' LIMIT 1;
  `);

  let companyId;
  if (companies.length === 0) {
    // Criar empresa padrão
    const [newCompany] = await queryInterface.sequelize.query(`
      INSERT INTO companies (name, email, plan, "maxUsers", "maxQueues", "isActive", "createdAt", "updatedAt")
      VALUES ('Zazap Master', 'admin@zazap.com', 'unlimited', 999999, 999999, true, NOW(), NOW())
      RETURNING id;
    `);
    companyId = newCompany[0].id;
  } else {
    companyId = companies[0].id;
  }

  // Associar todos os usuários existentes à empresa padrão
  await queryInterface.sequelize.query(`
    UPDATE users SET "companyId" = ${companyId} WHERE "companyId" IS NULL;
  `);

  // Tornar companyId obrigatório após migração dos dados
  await queryInterface.changeColumn('users', 'companyId', {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'companies',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  });
}

export async function down(queryInterface, Sequelize) {
  // Remover índice
  await queryInterface.removeIndex('users', 'users_company_id_index');
  
  // Remover coluna
  await queryInterface.removeColumn('users', 'companyId');
}
