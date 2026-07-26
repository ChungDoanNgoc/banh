import { UserRepository } from '../repositories/UserRepository';
import { OrderRepository } from '../repositories/OrderRepository';
import { ConfigRepository } from '../repositories/ConfigRepository';
import { SecurityService } from '../services/SecurityService';

/**
 * Class UserController [CONTROLLER]
 * Quản lý danh sách thành viên và phân quyền
 */
export class UserController {
  /**
   * Lấy danh sách thành viên công khai (ĐÃ STRIP/LOẠI BỎ TOÀN BỘ PASSWORD)
   */
  public static async getUsersPublic() {
    const users = await UserRepository.findAll();
    return users.map(u => u.toPublicView());
  }

  /**
   * Xóa tài khoản thành viên và toàn bộ đơn hàng liên quan
   */
  public static async deleteUser(
    operatorUsername: string,
    operatorRole: string,
    targetUsername: string
  ): Promise<{ success: boolean; error?: string }> {
    if (operatorRole !== 'ADMIN') {
      return { success: false, error: 'Access Denied: Chỉ Admin mới có quyền thực hiện.' };
    }

    if (operatorUsername.toLowerCase() === targetUsername.toLowerCase()) {
      return { success: false, error: 'Bạn không thể tự xóa tài khoản Admin đang sử dụng!' };
    }

    const config = await ConfigRepository.getConfig();
    if (targetUsername.toLowerCase() === config.superAdmin.toLowerCase()) {
      return { success: false, error: 'Không thể xóa tài khoản Super Admin hệ thống!' };
    }

    const targetUser = await UserRepository.findByUsername(targetUsername);
    if (!targetUser) {
      return { success: false, error: 'Tài khoản không tồn tại!' };
    }

    // 1. Xóa người dùng
    await UserRepository.deleteByUsername(targetUser.username);

    // 2. Xóa tất cả đơn hàng của người dùng này
    await OrderRepository.deleteByCustomerName(targetUser.username);

    return { success: true };
  }

  /**
   * Nâng quyền Quản trị viên (Admin)
   */
  public static async promoteToAdmin(
    operatorRole: string,
    targetUsername: string
  ): Promise<{ success: boolean; error?: string }> {
    if (operatorRole !== 'ADMIN') {
      return { success: false, error: 'Access Denied: Chỉ Admin mới có quyền cấp quyền.' };
    }

    const targetUser = await UserRepository.findByUsername(targetUsername);
    if (!targetUser) {
      return { success: false, error: 'Tài khoản không tồn tại!' };
    }

    targetUser.role = 'ADMIN';
    await UserRepository.save(targetUser);

    return { success: true };
  }
}
