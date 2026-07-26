import { FirebaseService } from '../services/FirebaseService';
import { DatabaseService } from '../services/DatabaseService';
import { InitializationService } from '../services/InitializationService';
import { ProductRepository } from './ProductRepository';
import { OrderModel, IOrderAttributes } from '../models/OrderModel';
import { ProductModel } from '../models/ProductModel';

/**
 * Class OrderRepository [REPOSITORY]
 * Kết nối & đồng bộ dữ liệu Đơn hàng với CSDL Sản phẩm (products table/collection).
 */
export class OrderRepository {
  private static COLLECTION = 'orders';
  private static DELETED_CACHE_FILE = 'deleted_order_ids.json';

  private static getDeletedIds(): Set<string> {
    const list = DatabaseService.readCollection<string>(this.DELETED_CACHE_FILE) || [];
    return new Set(list);
  }

  private static markIdsDeleted(ids: string[]): void {
    const current = this.getDeletedIds();
    ids.forEach(id => {
      if (id) current.add(id);
    });
    DatabaseService.writeCollection(this.DELETED_CACHE_FILE, Array.from(current));
  }

  public static async findAll(): Promise<OrderModel[]> {
    await InitializationService.ensureInitialized();
    const deletedIds = this.getDeletedIds();
    let records: IOrderAttributes[] = [];

    try {
      records = await FirebaseService.getCollectionDocs<IOrderAttributes>(this.COLLECTION);
    } catch {
      records = [];
    }

    if (!records || records.length === 0) {
      records = DatabaseService.readCollection<IOrderAttributes>('orders.json') || [];
    }

    // Lọc bỏ các đơn hàng đã bị xóa
    const activeRecords = records.filter(r => r.id && !deletedIds.has(r.id));
    DatabaseService.writeCollection('orders.json', activeRecords);

    // Lấy dữ liệu sản phẩm ĐỘNG từ CSDL bảng Products (Zero set cứng)
    const dbProducts = await ProductRepository.findAll();
    
    return activeRecords.map(o => {
      const rawName = (o.productName || o.type || '').trim();
      const lowerName = rawName.toLowerCase();

      // Tra cứu thông tin tên sản phẩm & đơn giá động từ bảng products
      let matchedProduct: ProductModel | undefined;
      if (lowerName) {
        matchedProduct = dbProducts.find(p => p.name.toLowerCase() === lowerName || lowerName.includes(p.name.toLowerCase()));
        if (!matchedProduct && lowerName.includes('chuối')) {
          matchedProduct = dbProducts.find(p => p.name.toLowerCase().includes('chuối'));
        }
        if (!matchedProduct && lowerName.includes('bao')) {
          matchedProduct = dbProducts.find(p => p.name.toLowerCase().includes('bao'));
        }
        if (!matchedProduct && lowerName.includes('tiêu')) {
          matchedProduct = dbProducts.find(p => p.name.toLowerCase().includes('tiêu'));
        }
      }

      const productName = matchedProduct ? matchedProduct.name : (rawName || 'Bánh Tiêu');
      const unitPrice = (o.unitPrice && Number(o.unitPrice) > 0) ? Number(o.unitPrice) : (matchedProduct ? matchedProduct.price : 6000);
      const category = o.category || (matchedProduct ? (matchedProduct.flag === 2 ? 'beverage' : 'pastry') : 'pastry');

      return new OrderModel({
        ...o,
        productName,
        unitPrice,
        category,
        totalPrice: (o.quantity || 1) * unitPrice
      });
    });
  }

  public static async findById(id: string): Promise<OrderModel | null> {
    const deletedIds = this.getDeletedIds();
    if (deletedIds.has(id)) return null;

    const orders = await this.findAll();
    return orders.find(o => o.id === id) || null;
  }

  public static async findByCustomerName(customerName: string): Promise<OrderModel[]> {
    const cleanName = customerName.trim().toLowerCase();
    const orders = await this.findAll();
    return orders.filter(o => (o.customerName || '').trim().toLowerCase() === cleanName);
  }

  public static async save(order: OrderModel): Promise<boolean> {
    const record = order.toJSON();
    const docId = order.id;

    try {
      await FirebaseService.saveDoc(this.COLLECTION, docId, record);
    } catch (e) {
      console.warn('[OrderRepository] Firebase save warning:', e);
    }

    const localOrders = DatabaseService.readCollection<IOrderAttributes>('orders.json') || [];
    const idx = localOrders.findIndex(o => o.id === docId);
    if (idx >= 0) {
      localOrders[idx] = record;
    } else {
      localOrders.push(record);
    }
    DatabaseService.writeCollection('orders.json', localOrders);

    return true;
  }

  public static async deleteById(id: string): Promise<boolean> {
    this.markIdsDeleted([id]);

    try {
      await FirebaseService.deleteDocById(this.COLLECTION, id);
    } catch (e) {
      console.warn('[OrderRepository] Firebase delete warning:', e);
    }

    const localOrders = DatabaseService.readCollection<IOrderAttributes>('orders.json') || [];
    const filtered = localOrders.filter(o => o.id !== id);
    DatabaseService.writeCollection('orders.json', filtered);

    return true;
  }

  public static async deleteByCustomerName(customerName: string): Promise<boolean> {
    const cleanName = customerName.trim().toLowerCase();
    
    const localOrders = DatabaseService.readCollection<IOrderAttributes>('orders.json') || [];
    const toDelete = localOrders.filter(o => (o.customerName || '').trim().toLowerCase() === cleanName);
    const idsToDelete = toDelete.map(o => o.id!).filter(Boolean);

    if (idsToDelete.length > 0) {
      this.markIdsDeleted(idsToDelete);
    }

    try {
      await FirebaseService.deleteDocsWhere(this.COLLECTION, "customerName", customerName);
    } catch (e) {
      console.warn('[OrderRepository] Firebase batch delete warning:', e);
    }

    const filtered = localOrders.filter(o => (o.customerName || '').trim().toLowerCase() !== cleanName);
    DatabaseService.writeCollection('orders.json', filtered);

    return true;
  }

  public static async clearAll(): Promise<boolean> {
    const localOrders = DatabaseService.readCollection<IOrderAttributes>('orders.json') || [];
    const ids = localOrders.map(o => o.id!).filter(Boolean);
    if (ids.length > 0) {
      this.markIdsDeleted(ids);
    }

    try {
      await FirebaseService.clearCollection(this.COLLECTION);
    } catch (e) {
      console.warn('[OrderRepository] Firebase clear warning:', e);
    }

    DatabaseService.writeCollection('orders.json', []);
    return true;
  }
}
