const dotenv = require('dotenv');

// Set the NODE_ENV to 'development' by default
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const envFound = dotenv.config();
if (!envFound) {
  // This error should crash whole process
  throw new Error("Couldn't find .env file"); // eslint-disable-line
}

const config = {
  env: 'test',
  /**
   * Your favorite port
   */
  port: parseInt(process.env.PORT, 10),

  /**
   * database configs
   */
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    database: process.env.DB_NAME ?? 'procurement_db',
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASS ?? 'root',
    dialect: process.env.DB_DIALECT ?? 'postgres',
  },

  /**
   * Your secret sauce
   */
  jwtSecret: process.env?.JWT_SECRET ?? "TESTS",
  jwtValidity: process.env?.JWT_VALIDITY ?? "24h",

  api: {
    prefix: '/v1',
  },

  pagination: {
    page: 1,
    limit: 20,
  },

  /**
   * set white listed api with api prefix
   */
  whiteListApi:  [
    '/v1/users/register',
    '/v1/users/login'
  ],

  publicDir: process.env.PUBLIC_DIR,
  uploadDir: process.env.UPLOAD_DIR,
  tempDir: process.env.TEMP_DIR,

  timezone: 'UTC',
  imageUpload: {
    maxFileSize: 5, // 5MB,
    allowExt: ['.jpg', '.png', '.jpeg'],
    publicUrl: process.env.S3_RECORDING_BUCKET_PUBLIC_URL,
  }
};

module.exports = config;  