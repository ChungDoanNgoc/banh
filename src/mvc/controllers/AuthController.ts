import { UserRepository } from '../repositories/UserRepository';
import { UserModel } from '../models/UserModel';
import { SecurityService } from '../services/SecurityService';

/**
 * Class AuthController [CONTROLLER]
 * Xử lý toàn bộ luồng đăng nhập, đăng ký và đổi mật khẩu
 */
export class AuthController {
  /**
   * Đăng nhập tài khoản
   */
  public static async login(
    usernameInput: string,
    passwordInput: string,
    isAdminMode: boolean
  ): Promise<{ success: boolean; token?: string; user?: any; error?: string }> {
    const cleanUsername = SecurityService.sanitizeInput(usernameInput);
    if (!cleanUsername) {
      return { success: false, error: 'Tên đăng nhập không được để trống!' };
    }
    if (!passwordInput) {
      return { success: false, error: 'Mật khẩu không được để trống!' };
    }

    const user = await UserRepository.findByUsername(cleanUsername);
    if (!user) {
      return { success: false, error: 'Tên đăng nhập không tồn tại!' };
    }

    // Xác thực mật khẩu băm Bcrypt động
    const isPasswordValid = await SecurityService.verifyPassword(passwordInput, user.passwordHash);
    if (!isPasswordValid) {
      return { success: false, error: 'Mật khẩu không chính xác!' };
    }

    if (isAdminMode && !user.isAdmin()) {
      return { success: false, error: 'Tài khoản của bạn không có quyền Quản trị viên (Admin)!' };
    }

    if (!isAdminMode && user.isAdmin()) {
      return { success: false, error: 'Tài khoản Admin yêu cầu chọn chế độ Quản trị viên khi đăng nhập!' };
    }

    const token = await SecurityService.generateToken({
      username: user.username,
      role: user.role
    });

    return {
      success: true,
      token,
      user: user.toPublicView()
    };
  }

  /**
   * Đăng ký tài khoản mới (Mã hóa động Bcrypt 12 rounds ở Runtime, KHÔNG lưu mã băm tĩnh)
   */
  public static async register(
    usernameInput: string,
    passwordInput: string
  ): Promise<{ success: boolean; error?: string }> {
    const usernameVal = SecurityService.validateUsername(usernameInput);
    if (!usernameVal.isValid) {
      return { success: false, error: usernameVal.message };
    }

    const passwordVal = SecurityService.validatePassword(passwordInput);
    if (!passwordVal.isValid) {
      return { success: false, error: passwordVal.message };
    }

    const cleanUsername = SecurityService.sanitizeInput(usernameInput);
    const isExist = await UserRepository.existsByUsername(cleanUsername);
    if (isExist) {
      return { success: false, error: 'Tên đăng nhập đã tồn tại trong hệ thống!' };
    }

    // Mã hóa runtime ngẫu nhiên
    const passwordHash = await SecurityService.hashPassword(passwordInput);
    const newUser = new UserModel({
      username: cleanUsername,
      passwordHash,
      role: 'USER'
    });

    const saved = await UserRepository.save(newUser);
    if (!saved) {
      return { success: false, error: 'Không thể lưu tài khoản. Vui lòng thử lại sau!' };
    }

    return { success: true };
  }

  /**
   * Đổi mật khẩu
   */
  public static async changePassword(
    username: string,
    oldPasswordInput: string,
    newPasswordInput: string
  ): Promise<{ success: boolean; error?: string }> {
    const user = await UserRepository.findByUsername(username);
    if (!user) {
      return { success: false, error: 'Tài khoản không tồn tại!' };
    }

    const isMatch = await SecurityService.verifyPassword(oldPasswordInput, user.passwordHash);
    if (!isMatch) {
      return { success: false, error: 'Mật khẩu hiện tại không đúng!' };
    }

    const passwordVal = SecurityService.validatePassword(newPasswordInput);
    if (!passwordVal.isValid) {
      return { success: false, error: passwordVal.message };
    }

    const newHash = await SecurityService.hashPassword(newPasswordInput);
    user.passwordHash = newHash;
    await UserRepository.save(user);

    return { success: true };
  }
}
