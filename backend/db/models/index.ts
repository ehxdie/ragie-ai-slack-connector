const fs = require('fs');
const path = require('path');
import { Sequelize, DataTypes } from 'sequelize';
const config = require('../config/config');

interface DbInterface {
  [key: string]: any;
  sequelize: Sequelize;
  Sequelize: typeof Sequelize;
}

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const envConfig = config[env];

const db: DbInterface = {} as DbInterface;
let sequelize: Sequelize;

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
    logging: console.log
  }
);

// Read model files
const modelFiles = fs
  .readdirSync(__dirname)
  .filter((file: string) => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      (file.endsWith('.js') || file.endsWith('.ts')) &&
      !file.endsWith('.test.js') &&
      !file.endsWith('.test.ts')
    );
  });

// Load models
for (const file of modelFiles) {
  try {
    const modelPath = path.join(__dirname, file);
    const model = require(modelPath);

    // Handle both direct function exports and module.exports
    const modelFunction = typeof model === 'function' ? model : model.default;

    if (typeof modelFunction === 'function') {
      const modelInstance = modelFunction(sequelize, DataTypes);
      if (modelInstance.name) {
        console.log(`Loading model: ${modelInstance.name}`);
        db[modelInstance.name] = modelInstance;
      } else {
        console.warn(`Model in ${file} has no name property`);
      }
    } else {
      console.warn(`Model ${file} has no default export or is not a function`);
    }
  } catch (error) {
    console.error(`Error loading model ${file}:`, error);
  }
}

// Initialize associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = {db};