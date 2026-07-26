import { OrderRepository } from '../repositories/OrderRepository';
import { ProductRepository } from '../repositories/ProductRepository';
import { ConfigRepository } from '../repositories/ConfigRepository';
import { UserRepository } from '../repositories/UserRepository';
import { OrderModel, IOrderAttributes } from '../models/OrderModel';
import { SecurityService } from '../services/SecurityService';
import * as XLSX from 'xlsx';

export interface IGroupedCustomerOrders {
  customerName: string;
  items: IOrderAttributes[];
  totalQuantity: number;
  totalPrice: number;
  isPaid: boolean;
  itemsSummary: string;
}

/**
 * Class OrderController [CONTROLLER]
 * Điều khiển toàn bộ vòng đời Đơn hàng, Phí ship và Xuất file báo cáo Excel
 */
export class OrderController {
  /**
   * Lấy toàn bộ đơn hàng & trạng thái hệ thống
   */
  public static async getOrdersOverview() {
    const orders = await OrderRepository.findAll();
    const config = await ConfigRepository.getConfig();
    const users = await UserRepository.findAll();

    const adminUsernames = users.filter(u => u.isAdmin()).map(u => u.username.toLowerCase());

    return {
      orders: orders.map(o => o.toJSON()),
      isOrderingWindowClosed: config.isOrderingWindowClosed,
      superAdmin: config.superAdmin,
      admins: adminUsernames
    };
  }

  /**
   * Gom nhóm danh sách đơn hàng theo từng Người dùng
   */
  public static groupOrdersByCustomer(orders: IOrderAttributes[]): IGroupedCustomerOrders[] {
    const map = new Map<string, IGroupedCustomerOrders>();

    orders.forEach(o => {
      const key = (o.customerName || '').toLowerCase().trim();
      if (!key) return;

      if (!map.has(key)) {
        map.set(key, {
          customerName: o.customerName,
          items: [],
          totalQuantity: 0,
          totalPrice: 0,
          isPaid: true,
          itemsSummary: ''
        });
      }

      const group = map.get(key)!;
      group.items.push(o);
      group.totalQuantity += Number(o.quantity) || 0;
      group.totalPrice += Number(o.totalPrice) || 0;
      if (!o.isPaid) {
        group.isPaid = false;
      }
    });

    return Array.from(map.values()).map(group => {
      const productCounts: Record<string, number> = {};
      group.items.forEach(item => {
        const pName = item.productName || item.type || 'Sản phẩm';
        productCounts[pName] = (productCounts[pName] || 0) + (item.quantity || 1);
      });

      const summaryParts = Object.entries(productCounts).map(([name, count]) => `${name} (${count}x)`);
      return {
        ...group,
        itemsSummary: summaryParts.join(', ')
      };
    });
  }

  /**
   * Đặt đơn hàng mới
   */
  public static async placeOrder(input: IOrderAttributes): Promise<{ success: boolean; order?: IOrderAttributes; error?: string }> {
    const config = await ConfigRepository.getConfig();
    if (config.isOrderingWindowClosed) {
      return { success: false, error: 'Form đăng ký đặt hàng hiện tại đã đóng!' };
    }

    const customerName = SecurityService.sanitizeInput(input.customerName);
    if (!customerName) {
      return { success: false, error: 'Vui lòng nhập tên người đặt!' };
    }

    const qty = Math.max(1, Number(input.quantity) || 1);
    let unitPrice = Math.max(0, Number(input.unitPrice) || 0);

    const productName = input.productName || input.type || '';

    if (unitPrice === 0 && productName) {
      const products = await ProductRepository.findAll();
      const match = products.find(p => p.name.toLowerCase() === productName.toLowerCase());
      if (match) {
        unitPrice = match.price;
      }
    }

    const newOrder = new OrderModel({
      ...input,
      customerName,
      productName,
      quantity: qty,
      unitPrice
    });

    const saved = await OrderRepository.save(newOrder);
    if (!saved) {
      return { success: false, error: 'Không thể lưu đơn hàng.' };
    }

    return { success: true, order: newOrder.toJSON() };
  }

  /**
   * Cập nhật số lượng đơn hàng
   */
  public static async updateOrderQuantity(orderId: string, quantity: number): Promise<{ success: boolean; error?: string }> {
    const order = await OrderRepository.findById(orderId);
    if (!order) {
      return { success: false, error: 'Đơn hàng không tồn tại!' };
    }

    const newQty = Math.max(1, Number(quantity) || 1);
    order.quantity = newQty;
    order.calculateTotal();
    await OrderRepository.save(order);
    return { success: true };
  }

  /**
   * Đánh dấu trạng thái thanh toán
   */
  public static async togglePayment(orderId: string, isPaid: boolean): Promise<{ success: boolean; error?: string }> {
    const order = await OrderRepository.findById(orderId);
    if (!order) {
      return { success: false, error: 'Đơn hàng không tồn tại!' };
    }

    order.setPaidStatus(isPaid);
    await OrderRepository.save(order);
    return { success: true };
  }

  /**
   * Cập nhật trạng thái thanh toán cho toàn bộ đơn hàng của 1 User
   */
  public static async toggleUserPayment(customerName: string, isPaid: boolean): Promise<{ success: boolean; error?: string }> {
    const orders = await OrderRepository.findByCustomerName(customerName);
    if (orders.length === 0) {
      return { success: false, error: 'Không tìm thấy đơn hàng của người này!' };
    }

    for (const order of orders) {
      order.setPaidStatus(isPaid);
      await OrderRepository.save(order);
    }
    return { success: true };
  }

  /**
   * Xóa một đơn hàng
   */
  public static async deleteOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
    const deleted = await OrderRepository.deleteById(orderId);
    if (!deleted) {
      return { success: false, error: 'Không thể xóa đơn hàng.' };
    }
    return { success: true };
  }

  /**
   * Xóa toàn bộ đơn hàng của 1 User
   */
  public static async deleteUserOrders(customerName: string): Promise<{ success: boolean; error?: string }> {
    await OrderRepository.deleteByCustomerName(customerName);
    return { success: true };
  }

  /**
   * Reset/Xóa toàn bộ đơn hàng trong ngày
   */
  public static async resetDailyOrders(): Promise<{ success: boolean; error?: string }> {
    await OrderRepository.clearAll();
    return { success: true };
  }

  /**
   * Bật/Tắt trạng thái mở form đặt hàng
   */
  public static async toggleOrderingWindow(isClosed: boolean) {
    const updated = await ConfigRepository.updateConfig({ isOrderingWindowClosed: isClosed });
    return { success: true, isOrderingWindowClosed: updated.isOrderingWindowClosed };
  }

  /**
   * Xuất file Excel báo cáo đơn hàng
   */
  public static async exportOrdersExcelBuffer(): Promise<Buffer> {
    const orders = await OrderRepository.findAll();
    const rows = orders.map((o, idx) => ({
      'STT': idx + 1,
      'Người Đặt': o.customerName,
      'Danh Mục': o.category === 'beverage' ? 'Đồ Uống' : 'Bánh Tiêu',
      'Tên Món': o.productName,
      'Số Lượng': o.quantity,
      'Đơn Giá (VNĐ)': o.unitPrice,
      'Thành Tiền (VNĐ)': o.totalPrice,
      'Ghi Chú': o.note || '',
      'Trạng Thái': o.isPaid ? 'Đã thanh toán' : 'Chưa trả',
      'Thời Gian': o.createdAt ? new Date(o.createdAt).toLocaleString('vi-VN') : ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 6 }, { wch: 20 }, { wch: 15 }, { wch: 22 },
      { wch: 10 }, { wch: 15 }, { wch: 16 }, { wch: 25 },
      { wch: 20 }, { wch: 22 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Báo Cáo Đơn Hàng');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}
