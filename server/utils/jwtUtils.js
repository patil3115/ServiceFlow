const jwt = require('jsonwebtoken');

/**
 * Generate signed JWT authentication token
 * @param {string} userId - Mongoose User ObjectId string
 * @returns {string} Signed JWT token
 */
const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'serviceflow_dev_jwt_secret_change_in_prod';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign({ id: userId }, secret, { expiresIn });
};

/**
 * Verify JWT token
 * @param {string} token - Bearer JWT token string
 * @returns {Object} Decoded payload
 */
const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET || 'serviceflow_dev_jwt_secret_change_in_prod';
  return jwt.verify(token, secret);
};

module.exports = {
  generateToken,
  verifyToken
};
