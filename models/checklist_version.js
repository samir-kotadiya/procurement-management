const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const userModel = require('./user');
const checklistModel = require('./checklist');

const ChecklistVersion = sequelize.define('ChecklistVersion', {
    checklistId: { 
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: checklistModel, // 'User' model
            key: 'id',
        },
    },
    version: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
    },
    questions: {
        type: DataTypes.JSONB,
        allowNull: false
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
    tableName: 'checklist_versions',
    timestamps: true,
});

module.exports = ChecklistVersion;
