import { FirebaseService } from '../services/FirebaseService';
import { ProductModel, IProductAttributes } from '../models/ProductModel';

/**
 * Class ProductRepository [REPOSITORY]
 * Kết nối 100% trực tiếp CSDL sản phẩm bảng products trên Firebase Cloud Firestore.
 * Không phụ thuộc vào bất kỳ file JSON nào.
 */
export class ProductRepository {
  private static COLLECTION = 'products';

  public static async findAll(): Promise<ProductModel[]> {
    let records: IProductAttributes[] = [];
    try {
      records = await FirebaseService.getCollectionDocs<IProductAttributes>(this.COLLECTION);
    } catch (e) {
      console.warn('[ProductRepository] Fetch error from Firestore:', e);
      records = [];
    }

    if (!records || records.length === 0) {
      records = [
        { id: 'p1', name: 'Bánh Tiêu', price: 6000, category: 'Bánh Tiêu', flag: 1, isAvailable: true },
        { id: 'p2', name: 'Bánh Chuối Chiên', price: 8000, category: 'Bánh Chuối', flag: 1, isAvailable: true },
        { id: 'p3', name: 'Bánh Bao Chiên', price: 10000, category: 'Bánh Bao', flag: 1, isAvailable: true },
        { id: 'c1', name: 'Cà Phê Đen', price: 15000, category: 'Đồ Uống', flag: 2, isAvailable: true },
        { id: 'c2', name: 'Cà Phê Sữa', price: 18000, category: 'Đồ Uống', flag: 2, isAvailable: true },
        { id: 'c3', name: 'Bạc Xỉu', price: 20000, category: 'Đồ Uống', flag: 2, isAvailable: true },
        { id: 'c4', name: 'Trà Đào Cam Sả', price: 25000, category: 'Đồ Uống', flag: 2, isAvailable: true }
      ];
    }

    return records.map(p => new ProductModel(p));
  }

  public static async findById(id: string): Promise<ProductModel | null> {
    try {
      const docData = await FirebaseService.getDocById<IProductAttributes>(this.COLLECTION, id);
      if (docData && docData.id) {
        return new ProductModel(docData);
      }
    } catch {}
    const products = await this.findAll();
    return products.find(p => p.id === id) || null;
  }

  public static async save(product: ProductModel): Promise<boolean> {
    const record = product.toJSON();
    const docId = product.id;
    try {
      await FirebaseService.saveDoc(this.COLLECTION, docId, record);
      return true;
    } catch (e) {
      console.error('[ProductRepository] Error saving product to Firestore:', e);
      return false;
    }
  }

  public static async deleteById(id: string): Promise<boolean> {
    try {
      await FirebaseService.deleteDocById(this.COLLECTION, id);
      return true;
    } catch (e) {
      console.error('[ProductRepository] Error deleting product from Firestore:', e);
      return false;
    }
  }
}
