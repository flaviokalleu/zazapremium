export const up = async (queryInterface, Sequelize) => {
  try {
    // Adicionar coluna companyId à tabela settings
    await queryInterface.addColumn('settings', 'companyId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'companies',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    console.log('✅ Coluna companyId adicionada à tabela settings');
  } catch (error) {
    console.error('❌ Erro na migração settings companyId:', error);
    throw error;
  }
};

export const down = async (queryInterface, Sequelize) => {
  try {
    // Remover coluna companyId da tabela settings
    await queryInterface.removeColumn('settings', 'companyId');
    
    console.log('✅ Coluna companyId removida da tabela settings');
  } catch (error) {
    console.error('❌ Erro ao reverter migração settings companyId:', error);
    throw error;
  }
};
