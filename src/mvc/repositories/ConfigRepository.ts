import { FirebaseService } from '../services/FirebaseService';
import { DatabaseService } from '../services/DatabaseService';
import { InitializationService } from '../services/InitializationService';
import { SystemConfigModel, ISystemConfigAttributes } from '../models/SystemConfigModel';

/**
 * Class ConfigRepository [REPOSITORY]
 * Kết nối Cấu hình hệ thống trực tiếp tới CSDL Firebase Firestore
 */
export class ConfigRepository {
  private static COLLECTION = 'config';
  private static DOC_ID = 'system';

  public static async getConfig(): Promise<SystemConfigModel> {
    await InitializationService.ensureInitialized();
    let raw = await FirebaseService.getDocById<ISystemConfigAttributes>(this.COLLECTION, this.DOC_ID);

    if (!raw) {
      raw = DatabaseService.readConfig<ISystemConfigAttributes>('config.json');
    } else {
      DatabaseService.writeConfig('config.json', raw);
    }

    return new SystemConfigModel(raw || undefined);
  }

  public static async updateConfig(partial: Partial<ISystemConfigAttributes>): Promise<SystemConfigModel> {
    const current = await this.getConfig();
    const updatedData = { ...current.toJSON(), ...partial };

    await FirebaseService.saveDoc(this.COLLECTION, this.DOC_ID, updatedData);
    DatabaseService.writeConfig('config.json', updatedData);

    return new SystemConfigModel(updatedData);
  }
}
