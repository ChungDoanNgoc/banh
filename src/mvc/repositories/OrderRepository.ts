import { FirebaseService } from '../services/FirebaseService';
import { ProductRepository } from './ProductRepository';
import { OrderModel, IOrderAttributes } from '../models/OrderModel';
import { ProductModel } from '../models/ProductModel';

/**
 * Class OrderRepository [REPOSITORY]
 * Kết nối & đồng bộ dữ liệu Đơn hàng 100% với CSDL Firestore (orders & products collections).
 * Không sử dụng bất kỳ tệp JSON cục bộ nào.
 */
export class OrderRepository {
  private static COLLECTION = 'orders';

  public static async findAll(): Promise<OrderModel[]> {
    let records: IOrderAttributes[] = [];
    try {
      records = await FirebaseService.getCollectionDocs<IOrderAttributes>(this.COLLECTION);
    } catch (e) {
      console.warn('[OrderRepository] Fetch error from Firestore:', e);
      records = [];
    }

    const dbProducts = await ProductRepository.findAll();
    
    return records.map(o => {
      const rawName = (o.productName || o.type || '').trim();
      const lowerName = rawName.toLowerCase();

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
    try {
      const docData = await FirebaseService.getDocById<IOrderAttributes>(this.COLLECTION, id);
      if (docData && docData.id) {
        return new OrderModel(docData);
      }
    } catch {}
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
      return true;
    } catch (e) {
      console.error('[OrderRepository] Error saving order to Firestore:', e);
      return false;
    }
  }

  public static async deleteById(id: string): Promise<boolean> {
    try {
      await FirebaseService.deleteDocById(this.COLLECTION, id);
      return true;
    } catch (e) {
      console.error('[OrderRepository] Error deleting order from Firestore:', e);
      return false;
    }
  }

  public static async deleteByCustomerName(customerName: string): Promise<boolean> {
    try {
      await FirebaseService.deleteDocsWhere(this.COLLECTION, "customerName", customerName);
      return true;
    } catch (e) {
      console.error('[OrderRepository] Error deleting customer orders from Firestore:', e);
      return false;
    }
  }

  public static async clearAll(): Promise<boolean> {
    try {
      await FirebaseService.clearCollection(this.COLLECTION);
      return true;
    } catch (e) {
      console.error('[OrderRepository] Error clearing orders from Firestore:', e);
      return false;
    }
  }
}
