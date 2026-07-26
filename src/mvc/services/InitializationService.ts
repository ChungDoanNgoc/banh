import { FirebaseService } from './FirebaseService';
import { IProductAttributes } from '../models/ProductModel';
import { ISystemConfigAttributes } from '../models/SystemConfigModel';

/**
 * Class InitializationService [SERVICE]
 * Khởi tạo dữ liệu thực đơn và cấu hình hệ thống ban đầu 100% trên Firestore.
 * Không đọc/ghi dữ liệu ra tệp JSON.
 */
export class InitializationService {
  private static COLLECTION_PRODUCTS = 'products';
  private static COLLECTION_CONFIG = 'config';

  public static async ensureInitialized(): Promise<void> {
    try {
      // Khởi tạo CSDL Products chuẩn đúng tên dự án BanhTieu trên Firestore
      const existingProducts = await FirebaseService.getCollectionDocs<IProductAttributes>(this.COLLECTION_PRODUCTS);

      if (!existingProducts || existingProducts.length === 0) {
        const defaultProducts: IProductAttributes[] = [
          { id: 'p1', name: 'Bánh Tiêu', price: 6000, category: 'Bánh Tiêu', flag: 1, isAvailable: true },
          { id: 'p2', name: 'Bánh Chuối Chiên', price: 8000, category: 'Bánh Chuối', flag: 1, isAvailable: true },
          { id: 'p3', name: 'Bánh Bao Chiên', price: 10000, category: 'Bánh Bao', flag: 1, isAvailable: true },
          { id: 'c1', name: 'Cà Phê Đen', price: 15000, category: 'Đồ Uống', flag: 2, isAvailable: true },
          { id: 'c2', name: 'Cà Phê Sữa', price: 18000, category: 'Đồ Uống', isAvailable: true },
          { id: 'c3', name: 'Bạc Xỉu', price: 20000, category: 'Đồ Uống', flag: 2, isAvailable: true },
          { id: 'c4', name: 'Trà Đào Cam Sả', price: 25000, category: 'Đồ Uống', flag: 2, isAvailable: true }
        ];

        for (const prod of defaultProducts) {
          await FirebaseService.saveDoc(this.COLLECTION_PRODUCTS, prod.id!, prod);
        }
      }

      // Khởi tạo CSDL Config trên Firestore
      const existingConfig = await FirebaseService.getDocById<ISystemConfigAttributes>(this.COLLECTION_CONFIG, 'system');
      if (!existingConfig) {
        const defaultConfig: ISystemConfigAttributes = {
          superAdmin: 'admin',
          isOrderingWindowClosed: false
        };
        await FirebaseService.saveDoc(this.COLLECTION_CONFIG, 'system', defaultConfig);
      }
    } catch (err) {
      console.warn('[InitializationService] Firestore initialization warning:', err);
    }
  }
}
