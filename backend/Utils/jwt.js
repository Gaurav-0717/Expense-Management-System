const JWT_SECRET = process.env.JWT_SECRET;

const JWT_CONFIG = {
  issuer: 'expense-app',
  audience: 'expense-app-users',
  expiresIn: '15m',
  algorithm: 'HS256',
};

function getJwtSecret() {
  if (!JWT_SECRET || JWT_SECRET.trim() === '' || JWT_SECRET === 'replace_this_secret') {
    throw new Error('JWT_SECRET must be set to a production secret');
  }
  return JWT_SECRET;
}

function getJwtOptions() {
  return { ...JWT_CONFIG };
}

module.exports = {
  getJwtSecret,
  getJwtOptions,
};
