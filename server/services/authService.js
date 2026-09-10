const { User } = require('../models');
const { generateToken } = require('../utils/jwtUtils');
const AppError = require('../utils/appError');

class AuthService {
  /**
   * Register a new employee account.
   * Role is strictly enforced as 'EMPLOYEE' during public registration.
   */
  async register({ name, email, password, department }) {
    // 1. Validate required fields
    if (!name || !name.trim()) {
      throw AppError.badRequest('Please provide your full name');
    }
    if (!email || !email.trim()) {
      throw AppError.badRequest('Please provide an email address');
    }
    if (!password) {
      throw AppError.badRequest('Please provide a password');
    }
    if (password.length < 6) {
      throw AppError.badRequest('Password must be at least 6 characters long');
    }
    if (!department || !department.trim()) {
      throw AppError.badRequest('Please specify your department');
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Check for duplicate account
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw AppError.conflict('An account with this email address already exists');
    }

    // 3. Create user (Strictly enforce EMPLOYEE role for security)
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      department: department.trim(),
      role: 'EMPLOYEE',
      isActive: true
    });

    // 4. Generate JWT
    const token = generateToken(user._id);

    return {
      token,
      user
    };
  }

  /**
   * Authenticate existing user with email and password
   */
  async login({ email, password }) {
    if (!email || !password) {
      throw AppError.badRequest('Please provide both email and password');
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user and explicitly select password hash
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      throw AppError.unauthorized('Invalid email or password');
    }

    // Check if account is active
    if (!user.isActive) {
      throw AppError.forbidden('Your account has been deactivated. Please contact your IT administrator.');
    }

    // Compare passwords
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      throw AppError.unauthorized('Invalid email or password');
    }

    // Generate JWT
    const token = generateToken(user._id);

    return {
      token,
      user: user.toJSON()
    };
  }

  /**
   * Get current user profile by authenticated user ID
   */
  async getCurrentUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound('User profile not found');
    }
    if (!user.isActive) {
      throw AppError.forbidden('Account has been deactivated');
    }
    return user;
  }
}

module.exports = new AuthService();
