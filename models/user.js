const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const { ROLES } = require('../constants/common');

const User = sequelize.define('User', {
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
    },
    phoneCode: {
        type: DataTypes.STRING(3),
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING(15),
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    roleId: {
        type: DataTypes.INTEGER,
        values: Object.values(ROLES),
        allowNull: false,
    },
    procurementManagerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    createdBy: {
        type: DataTypes.INTEGER,
    },
    updatedBy: {
        type: DataTypes.INTEGER,
    }
}, {
    sequelize,
    tableName: 'users',
    timestamps: true,
},
);

module.exports = User;
