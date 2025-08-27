import { DataTypes } from 'sequelize';
import connectdb from '../libs/connect-db.lib.js';

const sequelize = new connectdb.getSequelize();

const User = sequelize.define(
  'users',
  {
    username: {
      type: DataTypes.STRING,
    },
    password: {
      type: DataTypes.STRING,
    },
    display_name: {
      type: DataTypes.STRING,
    },
    role_id: {
      type: DataTypes.INTEGER,
    },
    createdAt: {
      field: 'created_at',
      type: DataTypes.DATE,
    },
    updatedAt: {
      field: 'updated_at',
      type: DataTypes.DATE,
    },
  },
  {
    tableName: 'gih_users',
    // timestamps: false,
    // updatedAt: false,
    // createdAt: false,
  },
);

export default User;
