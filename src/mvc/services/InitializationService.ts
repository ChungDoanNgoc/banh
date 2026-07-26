import { FirebaseService } from './FirebaseService';
import { DatabaseService } from './DatabaseService';
import { IUserAttributes } from '../models/UserModel';
import { IProductAttributes } from '../models/ProductModel';
import { ISystemConfigAttributes } from '../models/SystemConfigModel';

/**
 * Class InitializationService [SERVICE]
 * Khởi tạo cấu hình và dữ liệu danh mục ban đầu cho dự án BanhTieu
 */
export class InitializationService {
  private static COLLECTION_USERS = 'UserRegit';
  private static COLLECTION_PRODUCTS = 'products';
  private static COLLECTION_CONFIG = 'config';

  public static async ensureInitialized(): Promise<void> {
    try {
      // 1. Đồng bộ CSDL bảng UserRegit (Không set cứng user trong config/code)
      const localUserRegit = DatabaseService.readCollection<IUserAttributes>('UserRegit.json');
      const legacyUsers = DatabaseService.readCollection<IUserAttributes>('users.json');

      if ((!localUserRegit || localUserRegit.length === 0) && legacyUsers && legacyUsers.length > 0) {
        DatabaseService.writeCollection('UserRegit.json', legacyUsers);
      }

      // 2. Khởi tạo CSDL Products chuẩn đúng tên dự án BanhTieu
      const existingProducts = await FirebaseService.getCollectionDocs<IProductAttributes>(this.COLLECTION_PRODUCTS);
      const localProducts = DatabaseService.readCollection<IProductAttributes>('products.json') || [];

      if (existingProducts.length === 0 && localProducts.length === 0) {
        const defaultProducts: IProductAttributes[] = [
          { id: 'p1', name: 'Bánh Tiêu', price: 6000, category: 'Bánh Tiêu', isAvailable: true },
          { id: 'p2', name: 'Bánh Chuối Chiên', price: 8000, category: 'Bánh Chuối', isAvailable: true },
          { id: 'p3', name: 'Bánh Bao Chiên', price: 10000, category: 'Bánh Bao', isAvailable: true },
          { id: 'c1', name: 'Cà Phê Đen', price: 15000, category: 'Đồ Uống', isAvailable: true },
          { id: 'c2', name: 'Cà Phê Sữa', price: 18000, category: 'Đồ Uống', isAvailable: true },
          { id: 'c3', name: 'Bạc Xỉu', price: 20000, category: 'Đồ Uống', isAvailable: true },
          { id: 'c4', name: 'Trà Đào Cam Sả', price: 25000, category: 'Đồ Uống', isAvailable: true }
        ];

        for (const prod of defaultProducts) {
          await FirebaseService.saveDoc(this.COLLECTION_PRODUCTS, prod.id!, prod);
        }
        DatabaseService.writeCollection('products.json', defaultProducts);
      }

      // 3. Khởi tạo CSDL Config
      const existingConfig = await FirebaseService.getDocById<ISystemConfigAttributes>(this.COLLECTION_CONFIG, 'system');
      if (!existingConfig) {
        const defaultConfig: ISystemConfigAttributes = {
          superAdmin: 'admin',
          isOrderingWindowClosed: false
        };
        await FirebaseService.saveDoc(this.COLLECTION_CONFIG, 'system', defaultConfig);
        DatabaseService.writeConfig('config.json', defaultConfig);
      }

    } catch (err) {
      console.warn('[InitializationService] Initialization warning:', err);
    }
  }
}
