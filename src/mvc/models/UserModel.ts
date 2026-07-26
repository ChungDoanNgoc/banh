export type UserRole = 'ADMIN' | 'USER';

export interface IUserAttributes {
  id?: string;
  username: string;
  name?: string;
  password?: string;
  passwordHash: string;
  role: UserRole;
  createdAt?: any;
}

/**
 * Class UserModel [MODEL]
 * Thực thể Model đại diện cho Người Dùng trong hệ thống
 */
export class UserModel {
  public id: string;
  public username: string;
  public passwordHash: string;
  public role: UserRole;
  public createdAt: string;

  constructor(attributes: IUserAttributes) {
    this.username = (attributes.username || attributes.name || '').trim();
    this.id = attributes.id || this.username.toLowerCase();
    this.passwordHash = attributes.passwordHash || '';
    this.role = attributes.role || 'USER';
    
    if (typeof attributes.createdAt === 'string') {
      this.createdAt = attributes.createdAt;
    } else {
      this.createdAt = new Date().toISOString();
    }
  }

  /**
   * Kiểm tra quyền Admin
   */
  public isAdmin(): boolean {
    return this.role === 'ADMIN';
  }

  /**
   * Chuyển đổi sang định dạng View công khai (LOẠI BỎ HOÀN TOÀN MẬT KHẨU)
   */
  public toPublicView() {
    return {
      id: this.id,
      username: this.username,
      role: this.role,
      createdAt: this.createdAt
    };
  }

  /**
   * Chuyển đổi lưu trữ CSDL
   */
  public toDatabaseRecord(): IUserAttributes {
    return {
      id: this.id,
      username: this.username,
      passwordHash: this.passwordHash,
      role: this.role,
      createdAt: this.createdAt
    };
  }
}
