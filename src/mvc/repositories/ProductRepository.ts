import { FirebaseService } from '../services/FirebaseService';
import { DatabaseService } from '../services/DatabaseService';
import { InitializationService } from '../services/InitializationService';
import { ProductModel, IProductAttributes } from '../models/ProductModel';

/**
 * Class ProductRepository [REPOSITORY]
 * Kết nối danh mục sản phẩm chuẩn CSDL BanhTieu
 */
export class ProductRepository {
  private static COLLECTION = 'products';

  public static async findAll(): Promise<ProductModel[]> {
    await InitializationService.ensureInitialized();
    let records = await FirebaseService.getCollectionDocs<IProductAttributes>(this.COLLECTION);

    if (!records || records.length === 0) {
      records = DatabaseService.readCollection<IProductAttributes>('products.json') || [];
    } else {
      DatabaseService.writeCollection('products.json', records);
    }

    if (records.length === 0) {
      records = [
        { id: 'p1', name: 'Bánh Tiêu', price: 6000, category: 'Bánh Tiêu', isAvailable: true },
        { id: 'p2', name: 'Bánh Chuối Chiên', price: 8000, category: 'Bánh Chuối', isAvailable: true },
        { id: 'p3', name: 'Bánh Bao Chiên', price: 10000, category: 'Bánh Bao', isAvailable: true },
        { id: 'c1', name: 'Cà Phê Đen', price: 15000, category: 'Đồ Uống', isAvailable: true },
        { id: 'c2', name: 'Cà Phê Sữa', price: 18000, category: 'Đồ Uống', isAvailable: true },
        { id: 'c3', name: 'Bạc Xỉu', price: 20000, category: 'Đồ Uống', isAvailable: true },
        { id: 'c4', name: 'Trà Đào Cam Sả', price: 25000, category: 'Đồ Uống', isAvailable: true }
      ];
      DatabaseService.writeCollection('products.json', records);
    }

    return records.map(p => new ProductModel(p));
  }

  public static async findById(id: string): Promise<ProductModel | null> {
    const docData = await FirebaseService.getDocById<IProductAttributes>(this.COLLECTION, id);
    if (docData && docData.id) {
      return new ProductModel(docData);
    }
    const products = await this.findAll();
    return products.find(p => p.id === id) || null;
  }

  public static async save(product: ProductModel): Promise<boolean> {
    const record = product.toJSON();
    const docId = product.id;

    await FirebaseService.saveDoc(this.COLLECTION, docId, record);

    const localProds = DatabaseService.readCollection<IProductAttributes>('products.json') || [];
    const idx = localProds.findIndex(p => p.id === docId);
    if (idx >= 0) {
      localProds[idx] = record;
    } else {
      localProds.push(record);
    }
    DatabaseService.writeCollection('products.json', localProds);

    return true;
  }

  public static async deleteById(id: string): Promise<boolean> {
    await FirebaseService.deleteDocById(this.COLLECTION, id);

    const localProds = DatabaseService.readCollection<IProductAttributes>('products.json') || [];
    const filtered = localProds.filter(p => p.id !== id);
    DatabaseService.writeCollection('products.json', filtered);

    return true;
  }
}
