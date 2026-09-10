import api from './api';

export const categoryService = {
  async getCategories() {
    const response = await api.get('/categories');
    return response.data;
  }
};

export default categoryService;
