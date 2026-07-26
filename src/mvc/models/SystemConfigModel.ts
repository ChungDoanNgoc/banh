export interface ISystemConfigAttributes {
  superAdmin: string;
  isOrderingWindowClosed: boolean;
}

/**
 * Class SystemConfigModel [MODEL]
 * Thực thể Model đại diện cho Cấu hình hệ thống
 */
export class SystemConfigModel {
  public superAdmin: string;
  public isOrderingWindowClosed: boolean;

  constructor(attributes?: Partial<ISystemConfigAttributes>) {
    this.superAdmin = attributes?.superAdmin || 'admin';
    this.isOrderingWindowClosed = Boolean(attributes?.isOrderingWindowClosed);
  }

  public toJSON(): ISystemConfigAttributes {
    return {
      superAdmin: this.superAdmin,
      isOrderingWindowClosed: this.isOrderingWindowClosed
    };
  }
}
