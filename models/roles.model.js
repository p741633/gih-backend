import { DataTypes } from 'sequelize';
import connectdb from '../libs/connect-db.lib.js';

const sequelize = new connectdb.getSequelize();

const Role = sequelize.define(
  'roles',
  {
    role_id: {
      type: DataTypes.STRING,
    },
    role_type: {
      type: DataTypes.STRING,
    },
    role_name: {
      type: DataTypes.STRING,
    },
  },
  {
    tableName: 'roles',
    timestamps: false,
  },
);

export default Role;
