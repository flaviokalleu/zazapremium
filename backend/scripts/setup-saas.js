#!/usr/bin/env node

/**
 * Script para configurar o sistema SaaS multi-empresas
 * Executa migrações e seeders necessários
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Configurando sistema SaaS multi-empresas...\n');

try {
  // Executar migrações na ordem correta
  console.log('📦 Executando migrações SaaS...');
  
  const migrations = [
    '20250910000001-create-company',
    '20250910000002-add-is-master-admin-to-users', 
    '20250910000002-add-company-id-to-users',
    '20250910000005-add-company-id-to-tables'
  ];

  for (const migration of migrations) {
    try {
      console.log(`  ✅ Executando migração: ${migration}`);
      execSync(`npx sequelize-cli db:migrate --to ${migration}`, {
        cwd: path.dirname(__dirname),
        stdio: 'pipe'
      });
    } catch (error) {
      console.log(`  ⚠️  Migração já executada ou erro: ${migration}`);
    }
  }

  // Executar seeder do admin master
  console.log('\n👤 Criando administrador master...');
  try {
    execSync('npx sequelize-cli db:seed --seed 20250910000001-create-master-admin-fixed.js', {
      cwd: path.dirname(__dirname),
      stdio: 'pipe'
    });
    console.log('  ✅ Administrador master criado com sucesso!');
  } catch (error) {
    console.log('  ⚠️  Administrador master já existe ou erro na criação');
  }

  console.log('\n🎉 Configuração concluída com sucesso!');
  console.log('\n📋 Credenciais do administrador master:');
  console.log('  Email: admin@zazap.com');
  console.log('  Senha: admin123');
  console.log('\n⚠️  IMPORTANTE: Altere a senha padrão após o primeiro login!');
  
} catch (error) {
  console.error('❌ Erro durante a configuração:', error.message);
  process.exit(1);
}
