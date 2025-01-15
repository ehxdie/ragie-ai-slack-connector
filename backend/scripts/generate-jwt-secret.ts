import crypto from 'crypto';

const secret = crypto.randomBytes(64).toString('hex');
console.log('Generated JWT Secret:');
console.log(secret);
console.log('\nAdd this to your .env file as:');
console.log(`JWT_SECRET=${secret}`);
