import { SignJWT, jwtVerify } from 'jose';

export interface ISessionUserPayload {
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Class SecurityService [SERVICE & SECURITY]
 * Quản lý Token JWT và Sanitization.
 * Mật khẩu lưu trực tiếp dạng nguyên bản (Plain Text) theo yêu cầu người dùng.
 */
export class SecurityService {
  private static JWT_SECRET_KEY = new TextEncoder().encode(
    process.env.JWT_SECRET || 'BANH_SECURE_DYNAMIC_JWT_KEY_2026_AGY_NEXTJS'
  );

  /**
   * Giữ nguyên mật khẩu dạng thô (Plain Text)
   */
  public static async hashPassword(plainTextPassword: string): Promise<string> {
    return plainTextPassword;
  }

  /**
   * So sánh trực tiếp mật khẩu dạng thô
   */
  public static async verifyPassword(plainTextPassword: string, storedPassword: string): Promise<boolean> {
    if (!plainTextPassword || !storedPassword) return false;
    return plainTextPassword === storedPassword;
  }

  /**
   * Tạo Token JWT an toàn
   */
  public static async generateToken(payload: ISessionUserPayload): Promise<string> {
    return new SignJWT({ username: payload.username, role: payload.role })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(this.JWT_SECRET_KEY);
  }

  /**
   * Giải mã và xác minh Token JWT
   */
  public static async verifyToken(token: string): Promise<ISessionUserPayload | null> {
    try {
      if (!token) return null;
      const verified = await jwtVerify(token, this.JWT_SECRET_KEY);
      return verified.payload as unknown as ISessionUserPayload;
    } catch {
      return null;
    }
  }

  /**
   * Lọc bỏ HTML nguy hiểm chống XSS attack
   */
  public static sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') return '';
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim();
  }

  /**
   * Validate tên tài khoản
   */
  public static validateUsername(username: string): { isValid: boolean; message?: string } {
    const sanitized = this.sanitizeInput(username);
    if (!sanitized) {
      return { isValid: false, message: 'Tên đăng nhập không được để trống!' };
    }
    if (sanitized.length < 2 || sanitized.length > 30) {
      return { isValid: false, message: 'Tên đăng nhập phải có từ 2 đến 30 ký tự!' };
    }
    return { isValid: true };
  }

  /**
   * Validate mật khẩu
   */
  public static validatePassword(password: string): { isValid: boolean; message?: string } {
    if (!password || typeof password !== 'string') {
      return { isValid: false, message: 'Mật khẩu không được để trống!' };
    }
    return { isValid: true };
  }
}
