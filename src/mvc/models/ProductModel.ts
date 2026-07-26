export interface IProductAttributes {
  id?: string;
  name: string;
  price: number;
  category: 'pastry' | 'beverage' | string;
  flag?: number;
  isAvailable?: boolean;
}

/**
 * Class ProductModel [MODEL]
 * Thực thể Model đại diện cho Sản phẩm / Món ăn
 */
export class ProductModel {
  public id: string;
  public name: string;
  public price: number;
  public category: string;
  public flag: number;
  public isAvailable: boolean;

  constructor(attributes: IProductAttributes) {
    this.name = (attributes.name || '').trim();
    this.id = attributes.id || `prod_${this.name.toLowerCase().replace(/\s+/g, '_')}`;
    this.price = Math.max(0, Number(attributes.price) || 0);
    this.category = attributes.category || 'pastry';
    this.flag = attributes.flag ?? (this.category.toLowerCase().includes('đồ uống') || this.category === 'beverage' ? 2 : 1);
    this.isAvailable = attributes.isAvailable ?? true;
  }

  public updatePrice(newPrice: number): void {
    if (newPrice >= 0) {
      this.price = newPrice;
    }
  }

  public toJSON(): IProductAttributes {
    return {
      id: this.id,
      name: this.name,
      price: this.price,
      category: this.category,
      flag: this.flag,
      isAvailable: this.isAvailable
    };
  }
}
