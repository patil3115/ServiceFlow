const categoryService = require('../services/categoryService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const AppError = require('../utils/appError');

/**
 * @desc    Get all active categories
 * @route   GET /api/categories
 * @access  Public / Authenticated
 */
exports.getCategories = asyncHandler(async (req, res) => {
  // If ?all=true, return all (active and inactive), otherwise only active
  const filter = req.query.all === 'true' ? {} : { isActive: true };
  const categories = await categoryService.getAllCategories(filter);

  return ApiResponse.success(
    res,
    categories,
    `Retrieved ${categories.length} categories successfully`
  );
});

/**
 * @desc    Get category by ID
 * @route   GET /api/categories/:id
 * @access  Public / Authenticated
 */
exports.getCategoryById = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.id);
  return ApiResponse.success(res, category, 'Category retrieved successfully');
});

/**
 * @desc    Create new category
 * @route   POST /api/categories
 * @access  Admin
 */
exports.createCategory = asyncHandler(async (req, res) => {
  const { name, description, isActive } = req.body;
  if (!name || !name.trim()) {
    throw AppError.badRequest('Category name is required');
  }

  const newCategory = await categoryService.createCategory({ name, description, isActive });
  return ApiResponse.created(res, newCategory, 'Category created successfully');
});

/**
 * @desc    Update category
 * @route   PUT /api/categories/:id
 * @access  Admin
 */
exports.updateCategory = asyncHandler(async (req, res) => {
  const updatedCategory = await categoryService.updateCategory(req.params.id, req.body);
  return ApiResponse.success(res, updatedCategory, 'Category updated successfully');
});
