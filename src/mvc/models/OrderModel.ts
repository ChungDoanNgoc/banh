export interface IOrderAttributes {
  id?: string;
  customerName: string;
  category?: 'pastry' | 'beverage' | string;
  productName?: string;
  type?: string; // Tên món từ CSDL BanhTieu gốc
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  note?: string;
  isPaid?: boolean;
  createdAt?: any;
}

/**
 * Class OrderModel [MODEL]
 * Thực thể Model đại diện cho Đơn Hàng trong hệ thống
 */
export class OrderModel {
  public id: string;
  public customerName: string;
  public category: string;
  public productName: string;
  public quantity: number;
  public unitPrice: number;
  public totalPrice: number;
  public note: string;
  public isPaid: boolean;
  public createdAt: string;

  constructor(attributes: IOrderAttributes) {
    this.id = attributes.id || `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.customerName = (attributes.customerName || 'Khách').trim();
    
    this.productName = (attributes.productName || attributes.type || 'Sản phẩm').trim();
    this.category = attributes.category || 'pastry';
    this.quantity = Math.max(1, Number(attributes.quantity) || 1);

    this.unitPrice = Math.max(0, Number(attributes.unitPrice) || 0);
    this.totalPrice = attributes.totalPrice ?? (this.quantity * this.unitPrice);

    this.note = (attributes.note || '').trim();
    this.isPaid = Boolean(attributes.isPaid);
    
    if (typeof attributes.createdAt === 'string') {
      this.createdAt = attributes.createdAt;
    } else {
      this.createdAt = new Date().toISOString();
    }
  }

  public calculateTotal(): number {
    this.totalPrice = this.quantity * this.unitPrice;
    return this.totalPrice;
  }

  public setPaidStatus(paid: boolean): void {
    this.isPaid = paid;
  }

  public toJSON(): IOrderAttributes {
    return {
      id: this.id,
      customerName: this.customerName,
      category: this.category,
      productName: this.productName,
      type: this.productName,
      quantity: this.quantity,
      unitPrice: this.unitPrice,
      totalPrice: this.totalPrice,
      note: this.note,
      isPaid: this.isPaid,
      createdAt: this.createdAt
    };
  }
}
