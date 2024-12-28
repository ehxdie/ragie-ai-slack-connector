import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import path from 'path';
import { Sequelize, DataTypes } from 'sequelize';
import config from '../config/config.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const envConfig = config[env];
const db = {};
let sequelize;
// Check if we have all required environment variables
if (!envConfig.database || !envConfig.username || !envConfig.password) {
    throw new Error('Missing required database environment variables. Please check your .env file.');
}
sequelize = new Sequelize(envConfig.database, envConfig.username, envConfig.password, {
    host: envConfig.host,
    dialect: envConfig.dialect,
});
const files = fs
    .readdirSync(__dirname)
    .filter((file) => {
    return (file.indexOf('.') !== 0 &&
        file !== basename &&
        file.slice(-3) === '.js' &&
        file.indexOf('.test.js') === -1);
});
for (const file of files) {
    const model = await import(path.join(__dirname, file));
    db[model.default.name] = model.default(sequelize, DataTypes);
}
Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});
db.sequelize = sequelize;
db.Sequelize = Sequelize;
export default db;
