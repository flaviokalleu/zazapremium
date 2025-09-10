'use strict';

import bcrypt from 'bcryptjs';

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  // Criar empresa master
  const [company] = await queryInterface.bulkInsert('companies', [
    {
      name: 'Zazap Master',
      email: 'admin@zazap.com',
      phone: null,
      plan: 'unlimited',
      maxUsers: 999999,
      maxQueues: 999999,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ], { 
    returning: true 
  });

  // Criar usuário admin master
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  await queryInterface.bulkInsert('users', [
    {
      name: 'Administrador Master',
      email: 'admin@zazap.com',
      password: hashedPassword,
      role: 'super_admin', // Corrigir para super_admin
      isActive: true,
      isMasterAdmin: true, // Marca como admin master
      companyId: company.id || 1, // Fallback para ID 1 se returning não funcionar
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);
}

export async function down(queryInterface, Sequelize) {
  // Remover usuário admin
  await queryInterface.bulkDelete('users', {
    email: 'admin@zazap.com'
  });

  // Remover empresa master
  await queryInterface.bulkDelete('companies', {
    email: 'admin@zazap.com'
  });
}
