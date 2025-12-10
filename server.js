const express = require('express');
const config = require('./config');
const apiResponse = require('./middleware/api-response');
const sequelize = require('./config/db');
const authMiddleware = require('./middleware/auth');
const routes = require('./routes');

const app = express();
app.use(express.json());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
        'Access-Control-Allow-Methods',
        'DELETE, PUT, GET, POST, PATCH, OPTIONS',
    );
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    );
    next();
});

app.use(apiResponse);

// Load API routes
app.use(config.api.prefix, authMiddleware, routes);

// error handler
app.use((err, req, res, next) => {
    if (!err.output) {
      return res.status(500).json({
        statusCode: 500,
      });
    }
    return res.status(err.output.statusCode).json(err.output);
  });
  

sequelize.sync()
    .then(() => {
        console.log('Database synced');
        app.listen(3000, () => {
            console.log('Server is running on port 3000');
        });
    })
    .catch(err => {
        console.log('Error syncing database:', err);
    });
