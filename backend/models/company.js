import { DataTypes } from 'sequelize';
import sequelize from '../services/sequelize.js';

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Plano da empresa
  plan: {
    type: DataTypes.ENUM('basic', 'premium', 'unlimited'),
    allowNull: false,
    defaultValue: 'basic',
  },
  // Limites do plano
  maxUsers: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
    comment: 'Número máximo de usuários permitidos'
  },
  maxQueues: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 3,
    comment: 'Número máximo de filas permitidas'
  },
  // Status da empresa
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: 'companies',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['email']
    }
  ]
});

export default Company;
