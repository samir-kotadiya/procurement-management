const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const { ORDER_STATUSES } = require('../constants/common');
const userModel = require('./user');
const checklistModel = require('./checklist');
const orderChecklistAnswerModel = require('./order_checklist_answer');

const Order = sequelize.define('Order', {
    clientId: {
        type: DataTypes.INTEGER,
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
        defaultValue: 1,
    },
    procurmentManagerId: {
        type: DataTypes.INTEGER,
        references: {
            model: userModel, // 'User' model
            key: 'id',
        },
    },
    inspectionManagerId: {
        type: DataTypes.INTEGER,
        references: {
            model: userModel, // 'User' model
            key: 'id',
        },
    },
    status: {
        type: DataTypes.ENUM,
        values: Object.values(ORDER_STATUSES),
        defaultValue: ORDER_STATUSES.PENDING,
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
    tableName: 'orders',
    timestamps: true,
});

Order.hasOne(orderChecklistAnswerModel, {
    foreignKey: 'orderId',
    as: 'checklistAnswer'
});

Order.belongsTo(checklistModel, {
    foreignKey: 'checklistId',
    as: 'checklist'
});


module.exports = Order;
