const fs = require('fs');
const path = require('path');
import { Sequelize, DataTypes, Options } from 'sequelize';
const config = require('../config/config');

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const envConfig = config[env];

const db: { [key: string]: any } = {};
let sequelize;

// Check if we have all required environment variables
if (!envConfig.database || !envConfig.username || !envConfig.password) {
  throw new Error('Missing required database environment variables. Please check your .env file.');
}

sequelize = new Sequelize(
  envConfig.database,
  envConfig.username,
  envConfig.password,
  {
    host: envConfig.host,
    dialect: envConfig.dialect,
  }
);

fs.readdirSync(__dirname)
  .filter((file:any) => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach((file: any) => {
    const model = require(path.join(__dirname, file));
    db[model.default.name] = model.default(sequelize, DataTypes);
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;