import fs from 'fs';
import path from 'path';

/**
 * Class DatabaseService [SERVICE]
 * Xử lý I/O đọc và ghi dữ liệu nguyên tử (atomic JSON storage)
 */
export class DatabaseService {
  private static DATA_DIR = path.join(process.cwd(), 'data');

  public static ensureDataDirectory(): void {
    if (!fs.existsSync(this.DATA_DIR)) {
      fs.mkdirSync(this.DATA_DIR, { recursive: true });
    }
  }

  public static readCollection<T>(filename: string): T[] | null {
    this.ensureDataDirectory();
    const filePath = path.join(this.DATA_DIR, filename);
    try {
      if (!fs.existsSync(filePath)) {
        return null;
      }
      const raw = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(raw) as T[];
    } catch (err) {
      console.error(`[DatabaseService] Lỗi đọc tập tin ${filename}:`, err);
      return null;
    }
  }

  public static writeCollection<T>(filename: string, items: T[]): boolean {
    this.ensureDataDirectory();
    const filePath = path.join(this.DATA_DIR, filename);
    const tempPath = `${filePath}.tmp_${Date.now()}`;
    try {
      fs.writeFileSync(tempPath, JSON.stringify(items, null, 2), 'utf8');
      fs.renameSync(tempPath, filePath);
      return true;
    } catch (err) {
      console.error(`[DatabaseService] Lỗi ghi tập tin ${filename}:`, err);
      if (fs.existsSync(tempPath)) {
        try { fs.unlinkSync(tempPath); } catch {}
      }
      return false;
    }
  }

  public static readConfig<T>(filename: string): T | null {
    this.ensureDataDirectory();
    const filePath = path.join(this.DATA_DIR, filename);
    try {
      if (!fs.existsSync(filePath)) return null;
      const raw = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  public static writeConfig<T>(filename: string, config: T): boolean {
    this.ensureDataDirectory();
    const filePath = path.join(this.DATA_DIR, filename);
    try {
      fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf8');
      return true;
    } catch {
      return false;
    }
  }
}
