const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const checklistVersionModel = require('./checklist_version');
const userModel = require('./user');

const Checklist = sequelize.define('Checklist', {
    clientId: { 
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: userModel, // 'User' model
            key: 'id',
        },
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    version: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
    },
    questions: {
        type: DataTypes.JSONB,
        allowNull: false
    },
    isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    createdBy: { 
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: userModel, // 'User' model
            key: 'id',
        },
    },
}, {
    sequelize,
    tableName: 'checklist',
    timestamps: true,
});

Checklist.hasMany(checklistVersionModel, {
    foreignKey: 'checklistId',
    as: 'versions'
});

module.exports = Checklist;
