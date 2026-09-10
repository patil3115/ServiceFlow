const { Category } = require('../models');
const AppError = require('../utils/appError');

class CategoryService {
  /**
   * Retrieve all categories (optionally filtering for only active ones)
   */
  async getAllCategories(filter = {}) {
    return await Category.find(filter).sort({ name: 1 });
  }

  /**
   * Retrieve a single category by ID
   */
  async getCategoryById(id) {
    const category = await Category.findById(id);
    if (!category) {
      throw AppError.notFound(`Category not found with ID: ${id}`);
    }
    return category;
  }

  /**
   * Create a new category (Admin operation)
   */
  async createCategory(data) {
    const existing = await Category.findOne({ name: data.name.trim() });
    if (existing) {
      throw AppError.conflict(`Category '${data.name}' already exists.`);
    }

    return await Category.create({
      name: data.name.trim(),
      description: data.description ? data.description.trim() : '',
      isActive: data.isActive !== undefined ? data.isActive : true
    });
  }

  /**
   * Update category by ID
   */
  async updateCategory(id, data) {
    const category = await this.getCategoryById(id);

    if (data.name && data.name.trim() !== category.name) {
      const duplicate = await Category.findOne({
        name: data.name.trim(),
        _id: { $ne: id }
      });
      if (duplicate) {
        throw AppError.conflict(`Category '${data.name}' already exists.`);
      }
      category.name = data.name.trim();
    }

    if (data.description !== undefined) {
      category.description = data.description.trim();
    }

    if (data.isActive !== undefined) {
      category.isActive = data.isActive;
    }

    return await category.save();
  }
}

module.exports = new CategoryService();
