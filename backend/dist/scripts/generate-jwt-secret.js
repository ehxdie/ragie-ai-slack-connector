"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const secret = crypto_1.default.randomBytes(64).toString('hex');
console.log('Generated JWT Secret:');
console.log(secret);
console.log('\nAdd this to your .env file as:');
console.log(`JWT_SECRET=${secret}`);
