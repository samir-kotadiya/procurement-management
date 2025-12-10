const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const userModel = require('./user');
const checklistModel = require('./checklist');
const orderModel = require('./order');

const OrderChecklistAnswer = sequelize.define('OrderChecklistAnswer', {
    orderId: {
        type: DataTypes.INTEGER,
        references: {
            model: orderModel, // 'User' model
            key: 'id',
        },
        unique: true,
    },
    checklistId: {
        type: DataTypes.INTEGER,
        references: {
            model: checklistModel, // 'User' would also work
            key: 'id',
        },
    },
    checklistVersion: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    answers: {
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
    tableName: 'order_checklist_answers',
    timestamps: true,
});


module.exports = OrderChecklistAnswer;
