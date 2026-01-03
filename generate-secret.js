// Generate a secure secret for Better Auth
const crypto = require('crypto');

const secret = crypto.randomBytes(32).toString('base64');
console.log('Generated BETTER_AUTH_SECRET:');
console.log(secret);
console.log('');
console.log('Please use this value in your Vercel environment variables.');