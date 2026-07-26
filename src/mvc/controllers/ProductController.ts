import { ProductRepository } from '../repositories/ProductRepository';
import { ProductModel, IProductAttributes } from '../models/ProductModel';
import { SecurityService } from '../services/SecurityService';

/**
 * Class ProductController [CONTROLLER]
 * Quản lý thực đơn sản phẩm và đơn giá
 */
export class ProductController {
  public static async getProducts(): Promise<IProductAttributes[]> {
    const products = await ProductRepository.findAll();
    return products.map(p => p.toJSON());
  }

  public static async updatePrice(id: string, newPrice: number): Promise<{ success: boolean; error?: string }> {
    const product = await ProductRepository.findById(id);
    if (!product) {
      return { success: false, error: 'Sản phẩm không tồn tại!' };
    }

    const priceNum = Number(newPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      return { success: false, error: 'Đơn giá không hợp lệ!' };
    }

    product.updatePrice(priceNum);
    await ProductRepository.save(product);
    return { success: true };
  }

  public static async addProduct(name: string, price: number, category: string): Promise<{ success: boolean; error?: string }> {
    const cleanName = SecurityService.sanitizeInput(name);
    if (!cleanName) {
      return { success: false, error: 'Tên món không được để trống!' };
    }

    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum < 0) {
      return { success: false, error: 'Đơn giá không hợp lệ!' };
    }

    const newProd = new ProductModel({
      name: cleanName,
      price: priceNum,
      category: category || 'pastry'
    });

    await ProductRepository.save(newProd);
    return { success: true };
  }

  public static async deleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
    const deleted = await ProductRepository.deleteById(id);
    if (!deleted) {
      return { success: false, error: 'Không thể xóa món này.' };
    }
    return { success: true };
  }
}
