"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs');
const path = require('path');
const sequelize_1 = require("sequelize");
const config = require('../config/config');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const envConfig = config[env];
const db = {};
let sequelize;
// Check if we have all required environment variables
if (!envConfig.database || !envConfig.username || !envConfig.password) {
    throw new Error('Missing required database environment variables. Please check your .env file.');
}
sequelize = new sequelize_1.Sequelize(envConfig.database, envConfig.username, envConfig.password, {
    host: envConfig.host,
    dialect: envConfig.dialect,
    logging: console.log
});
// Read model files
const modelFiles = fs
    .readdirSync(__dirname)
    .filter((file) => {
    return (file.indexOf('.') !== 0 &&
        file !== basename &&
        (file.endsWith('.js') || file.endsWith('.ts')) &&
        !file.endsWith('.test.js') &&
        !file.endsWith('.test.ts'));
});
// Load models
for (const file of modelFiles) {
    try {
        const modelPath = path.join(__dirname, file);
        const model = require(modelPath);
        // Handle both direct function exports and module.exports
        const modelFunction = typeof model === 'function' ? model : model.default;
        if (typeof modelFunction === 'function') {
            const modelInstance = modelFunction(sequelize, sequelize_1.DataTypes);
            if (modelInstance.name) {
                console.log(`Loading model: ${modelInstance.name}`);
                db[modelInstance.name] = modelInstance;
            }
            else {
                console.warn(`Model in ${file} has no name property`);
            }
        }
        else {
            console.warn(`Model ${file} has no default export or is not a function`);
        }
    }
    catch (error) {
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
db.Sequelize = sequelize_1.Sequelize;
module.exports = { db };
