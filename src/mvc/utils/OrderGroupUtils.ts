export interface IGroupedCustomerOrders {
  customerName: string;
  items: any[];
  totalQuantity: number;
  totalPrice: number; // Tổng tiền chưa cộng phụ phí 1k
  finalTotalPrice: number; // Tổng tiền ĐÃ cộng +1.000 đ cho người dùng
  isPaid: boolean;
  itemsSummary: string;
  itemsSummaryLines: string[];
}

/**
 * Class OrderGroupUtils [UTILS]
 * Helper gom nhóm đơn hàng theo người dùng, hiển thị từng dòng món và tính +1.000đ cho mỗi user đặt hàng
 */
export class OrderGroupUtils {
  public static groupOrdersByCustomer(orders: any[]): IGroupedCustomerOrders[] {
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
          finalTotalPrice: 0,
          isPaid: true,
          itemsSummary: '',
          itemsSummaryLines: []
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
      const productCounts: Record<string, { count: number; price: number }> = {};
      group.items.forEach(item => {
        const pName = item.productName || item.type || 'Sản phẩm';
        const itemTotal = Number(item.totalPrice) || 0;
        if (!productCounts[pName]) {
          productCounts[pName] = { count: 0, price: 0 };
        }
        productCounts[pName].count += (item.quantity || 1);
        productCounts[pName].price += itemTotal;
      });

      const summaryLines = Object.entries(productCounts).map(([name, data]) => `${name} (${data.count}x)`);
      const finalTotalPrice = group.totalPrice + 1000; // Cộng thêm +1.000 đ cho người dùng đặt hàng

      return {
        ...group,
        finalTotalPrice,
        itemsSummaryLines: summaryLines,
        itemsSummary: summaryLines.join(', ')
      };
    });
  }
}
