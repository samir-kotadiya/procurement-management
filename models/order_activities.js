// models/order_activity.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const OrderActivity = sequelize.define('OrderActivity', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    orderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'orders', // Assumes your orders table is named 'orders'
            key: 'id',
        },
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users', // Assumes your users table is named 'users'
            key: 'id',
        },
    },
    activityType: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    details: {
        type: DataTypes.JSONB, // Use JSON for MariaDB/MySQL
        allowNull: true,
    },
}, {
    tableName: 'order_activities',
    timestamps: true,
    updatedAt: false, // Activity logs are typically immutable
});

module.exports = OrderActivity;
