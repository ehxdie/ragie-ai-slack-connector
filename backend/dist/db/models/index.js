"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs');
const path = require('path');
const sequelize_1 = require("sequelize");
const config = require('../config/config.js');
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
});
fs.readdirSync(__dirname)
    .filter((file) => {
    return (file.indexOf('.') !== 0 &&
        file !== basename &&
        file.slice(-3) === '.js' &&
        file.indexOf('.test.js') === -1);
})
    .forEach((file) => {
    const model = require(path.join(__dirname, file));
    db[model.default.name] = model.default(sequelize, sequelize_1.DataTypes);
});
Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});
db.sequelize = sequelize;
db.Sequelize = sequelize_1.Sequelize;
module.exports = db;
