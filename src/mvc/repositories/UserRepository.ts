import { FirebaseService } from '../services/FirebaseService';
import { UserModel, IUserAttributes } from '../models/UserModel';

/**
 * Class UserRepository [REPOSITORY]
 * Kết nối 100% trực tiếp tới CSDL Firebase Cloud Firestore bảng / collection UserRegit.
 * Không ghi/đọc dữ liệu ra bất kỳ file JSON cục bộ nào.
 */
export class UserRepository {
  private static COLLECTION = 'UserRegit';

  public static async findAll(): Promise<UserModel[]> {
    let records: IUserAttributes[] = [];
    try {
      records = await FirebaseService.getCollectionDocs<IUserAttributes>(this.COLLECTION);
    } catch (e) {
      console.warn('[UserRepository] Fetch error from Firestore:', e);
      records = [];
    }
    return records.map(u => new UserModel(u));
  }

  public static async findByUsername(username: string): Promise<UserModel | null> {
    if (!username) return null;
    const cleanName = username.trim().toLowerCase();

    try {
      const docData = await FirebaseService.getDocById<IUserAttributes>(this.COLLECTION, cleanName);
      if (docData && (docData.username || docData.name)) {
        return new UserModel(docData);
      }
    } catch {}

    const allUsers = await this.findAll();
    return allUsers.find(u => u.username.toLowerCase() === cleanName) || null;
  }

  public static async existsByUsername(username: string): Promise<boolean> {
    const user = await this.findByUsername(username);
    return user !== null;
  }

  public static async save(user: UserModel): Promise<boolean> {
    const record = user.toDatabaseRecord();
    const docId = user.username.toLowerCase();

    try {
      await FirebaseService.saveDoc(this.COLLECTION, docId, record);
      return true;
    } catch (e) {
      console.error('[UserRepository] Error saving user to Firestore:', e);
      return false;
    }
  }

  public static async deleteByUsername(username: string): Promise<boolean> {
    const docId = username.trim().toLowerCase();
    try {
      await FirebaseService.deleteDocById(this.COLLECTION, docId);
      return true;
    } catch (e) {
      console.error('[UserRepository] Error deleting user from Firestore:', e);
      return false;
    }
  }
}
