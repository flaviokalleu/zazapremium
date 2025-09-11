"use strict";

import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

// Permite configurar via ambiente sem precisar editar código
const ADMIN_EMAIL = process.env.MASTER_ADMIN_EMAIL || 'admin@zazap.com';
const ADMIN_PASSWORD = process.env.MASTER_ADMIN_PASSWORD || 'admin123';

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  // 1. Obter (ou criar) empresa master
  let companyId = 1; // Forçar companyId=1 conforme solicitação
  const [companyRows] = await queryInterface.sequelize.query(
    'SELECT id FROM companies WHERE email = :email LIMIT 1',
    { replacements: { email: ADMIN_EMAIL } }
  );

  if (companyRows.length === 0) {
    // Garante existência da empresa id=1 (ou insere ignorando conflito se já existir)
    await queryInterface.sequelize.query(
      `INSERT INTO companies (id, name, email, phone, plan, "maxUsers", "maxQueues", "isActive", "createdAt", "updatedAt")
       VALUES (1, 'Zazap Master', :email, NULL, 'unlimited', 999999, 999999, true, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name`,
      { replacements: { email: ADMIN_EMAIL } }
    );
  }

  // 2. Criar ou atualizar usuário master
  const [userRows] = await queryInterface.sequelize.query(
    'SELECT id FROM users WHERE email = :email LIMIT 1',
    { replacements: { email: ADMIN_EMAIL } }
  );

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  if (userRows.length > 0) {
    // Atualiza senha / flags para garantir acesso conhecido
    await queryInterface.sequelize.query(
      `UPDATE users SET password = :password, role = 'super_admin', "isActive" = true, "isMasterAdmin" = true, "companyId" = :companyId, "updatedAt" = NOW()
       WHERE email = :email`,
      { replacements: { password: hashedPassword, email: ADMIN_EMAIL, companyId } }
    );
  } else {
    await queryInterface.sequelize.query(
      `INSERT INTO users (name, email, password, role, "isActive", "isMasterAdmin", "companyId", "createdAt", "updatedAt")
       VALUES ('Administrador Master', :email, :password, 'super_admin', true, true, :companyId, NOW(), NOW())`,
      { replacements: { email: ADMIN_EMAIL, password: hashedPassword, companyId } }
    );
  }
}
export async function down(queryInterface, Sequelize) {
  await queryInterface.sequelize.query(
    'DELETE FROM users WHERE email = :email',
    { replacements: { email: ADMIN_EMAIL } }
  );
  await queryInterface.sequelize.query(
    'DELETE FROM companies WHERE email = :email',
    { replacements: { email: ADMIN_EMAIL } }
  );
}
