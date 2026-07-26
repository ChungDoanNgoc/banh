import { FirebaseService } from '../services/FirebaseService';
import { DatabaseService } from '../services/DatabaseService';
import { InitializationService } from '../services/InitializationService';
import { UserModel, IUserAttributes } from '../models/UserModel';

/**
 * Class UserRepository [REPOSITORY]
 * Kết nối trực tiếp tới CSDL bảng / collection UserRegit.
 * Không hardcode người dùng trong file cấu hình hay mã nguồn.
 */
export class UserRepository {
  private static COLLECTION = 'UserRegit';
  private static DB_FILE = 'UserRegit.json';

  public static async findAll(): Promise<UserModel[]> {
    await InitializationService.ensureInitialized();
    let records: IUserAttributes[] = [];

    try {
      records = await FirebaseService.getCollectionDocs<IUserAttributes>(this.COLLECTION);
    } catch {
      records = [];
    }

    if (!records || records.length === 0) {
      records = DatabaseService.readCollection<IUserAttributes>(this.DB_FILE) || [];
    } else {
      DatabaseService.writeCollection(this.DB_FILE, records);
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
    } catch (e) {
      console.warn('[UserRepository] Firebase save warning:', e);
    }

    const localUsers = DatabaseService.readCollection<IUserAttributes>(this.DB_FILE) || [];
    const idx = localUsers.findIndex(u => (u.username || u.name || '').toLowerCase() === docId);
    if (idx >= 0) {
      localUsers[idx] = record;
    } else {
      localUsers.push(record);
    }
    DatabaseService.writeCollection(this.DB_FILE, localUsers);

    return true;
  }

  public static async deleteByUsername(username: string): Promise<boolean> {
    const docId = username.trim().toLowerCase();

    try {
      await FirebaseService.deleteDocById(this.COLLECTION, docId);
    } catch (e) {
      console.warn('[UserRepository] Firebase delete warning:', e);
    }

    const localUsers = DatabaseService.readCollection<IUserAttributes>(this.DB_FILE) || [];
    const filtered = localUsers.filter(u => (u.username || u.name || '').toLowerCase() !== docId);
    DatabaseService.writeCollection(this.DB_FILE, filtered);

    return true;
  }
}
