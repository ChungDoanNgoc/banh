import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

export interface ISessionUserPayload {
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Class SecurityService [SERVICE & SECURITY]
 * Đảm nhận toàn bộ nghiệp vụ Mã hóa runtime động, Token JWT và Sanitization.
 * LOẠI BỎ 100% CÁC CHUỖI MÃ BĂM HARDCODE TRONG SOURCE CODE.
 */
export class SecurityService {
  private static JWT_SECRET_KEY = new TextEncoder().encode(
    process.env.JWT_SECRET || 'BANH_SECURE_DYNAMIC_JWT_KEY_2026_AGY_NEXTJS'
  );
  private static SALT_ROUNDS = 12;

  /**
   * Mã hóa mật khẩu ĐỘNG BẤT ĐỒNG BỘ ở thời điểm runtime (Bcrypt 12 rounds)
   * Tuyệt đối không dùng hash cứng hoặc salt tĩnh trong mã nguồn.
   */
  public static async hashPassword(plainTextPassword: string): Promise<string> {
    if (!plainTextPassword || typeof plainTextPassword !== 'string') {
      throw new Error('Mật khẩu hợp lệ là bắt buộc để băm mã hóa.');
    }
    const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
    return bcrypt.hash(plainTextPassword, salt);
  }

  /**
   * Xác thực mật khẩu nhập vào với mã băm trong CSDL
   */
  public static async verifyPassword(plainTextPassword: string, passwordHash: string): Promise<boolean> {
    if (!plainTextPassword || !passwordHash) return false;
    return bcrypt.compare(plainTextPassword, passwordHash);
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
   * Validate tên tài khoản (3-30 ký tự, chữ/số/-_)
   */
  public static validateUsername(username: string): { isValid: boolean; message?: string } {
    const sanitized = this.sanitizeInput(username);
    if (!sanitized) {
      return { isValid: false, message: 'Tên đăng nhập không được để trống!' };
    }
    if (sanitized.length < 3 || sanitized.length > 30) {
      return { isValid: false, message: 'Tên đăng nhập phải có từ 3 đến 30 ký tự!' };
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
      return { isValid: false, message: 'Tên đăng nhập chỉ bao gồm chữ cái, số, gạch dưới (_) hoặc gạch ngang (-)' };
    }
    return { isValid: true };
  }

  /**
   * Validate mật khẩu (tối thiểu 6 ký tự)
   */
  public static validatePassword(password: string): { isValid: boolean; message?: string } {
    if (!password || typeof password !== 'string') {
      return { isValid: false, message: 'Mật khẩu không được để trống!' };
    }
    if (password.length < 6) {
      return { isValid: false, message: 'Mật khẩu phải chứa ít nhất 6 ký tự!' };
    }
    return { isValid: true };
  }
}
