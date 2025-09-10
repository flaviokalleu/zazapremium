export const up = async (queryInterface, Sequelize) => {
  try {
    // Usar ALTER TYPE para adicionar o novo valor ao enum existente
    await queryInterface.sequelize.query(
      "ALTER TYPE \"enum_users_role\" ADD VALUE 'super_admin' BEFORE 'admin';"
    );

    console.log('✅ Valor super_admin adicionado ao enum de roles');
  } catch (error) {
    console.error('❌ Erro ao atualizar enum de roles:', error);
    // Se o valor já existe, ignorar o erro
    if (error.message && error.message.includes('already exists')) {
      console.log('✅ Valor super_admin já existe no enum');
      return;
    }
    throw error;
  }
};

export const down = async (queryInterface, Sequelize) => {
  try {
    // Primeiro, converter todos os usuários super_admin para admin
    await queryInterface.sequelize.query(
      "UPDATE users SET role = 'admin' WHERE role = 'super_admin';"
    );

    // Não é possível remover um valor de um enum no PostgreSQL
    // A operação de down seria complexa e arriscada
    console.log('⚠️ Não é possível remover valores de enum no PostgreSQL. Usuários super_admin foram convertidos para admin.');
  } catch (error) {
    console.error('❌ Erro ao reverter enum de roles:', error);
    throw error;
  }
};
