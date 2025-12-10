const { Sequelize } = require('sequelize');
const config = require('../config');

const sequelize = new Sequelize(config.db.database, config.db.user, config.db.password, {
    host: config.db.host,
    dialect: config.db.dialect, // one of 'mysql' | 'mariadb' | 'postgres' | 'mssql'
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    // logging: false
  });

  // Verify the connection
sequelize.authenticate()
.then(() => {
  console.log('Connection established successfully.');
  //sequelize.sync();
})
.catch(err => console.error('Unable to connect to the database:', err));

module.exports = sequelize;
