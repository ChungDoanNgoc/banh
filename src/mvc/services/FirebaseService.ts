import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  where,
  writeBatch
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyB_placeholder",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "banhtieufpt.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "banhtieufpt",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "banhtieufpt.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1234567890:web:abcdef"
};

// Initialize Firebase app singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

/**
 * Class FirebaseService [SERVICE]
 * Wrapper thực hiện các thao tác CRUD tới Firebase Firestore Cloud Database
 * KHÔNG DÙNG ARRAY HARDCODE HAY SET CỨNG TRONG CODE
 */
export class FirebaseService {
  /**
   * Truy vấn toàn bộ tài liệu trong 1 Collection từ Firebase Firestore
   */
  public static async getCollectionDocs<T>(collectionName: string): Promise<T[]> {
    try {
      const colRef = collection(db, collectionName);
      const snapshot = await getDocs(colRef);
      const docs: T[] = [];
      snapshot.forEach(docSnap => {
        docs.push({ id: docSnap.id, ...docSnap.data() } as unknown as T);
      });
      return docs;
    } catch (err) {
      console.warn(`[FirebaseService] Warn fetching ${collectionName}:`, err);
      return [];
    }
  }

  /**
   * Đọc 1 tài liệu theo Doc ID từ Firebase Firestore
   */
  public static async getDocById<T>(collectionName: string, docId: string): Promise<T | null> {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as unknown as T;
      }
      return null;
    } catch (err) {
      console.warn(`[FirebaseService] Error getting doc ${collectionName}/${docId}:`, err);
      return null;
    }
  }

  /**
   * Lưu / Cập nhật 1 tài liệu vào Firebase Firestore
   */
  public static async saveDoc<T extends Record<string, any>>(collectionName: string, docId: string, data: T): Promise<boolean> {
    try {
      const docRef = doc(db, collectionName, docId);
      await setDoc(docRef, data, { merge: true });
      return true;
    } catch (err) {
      console.error(`[FirebaseService] Error saving doc ${collectionName}/${docId}:`, err);
      return false;
    }
  }

  /**
   * Xóa 1 tài liệu theo Doc ID khỏi Firebase Firestore
   */
  public static async deleteDocById(collectionName: string, docId: string): Promise<boolean> {
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
      return true;
    } catch (err) {
      console.error(`[FirebaseService] Error deleting doc ${collectionName}/${docId}:`, err);
      return false;
    }
  }

  /**
   * Truy vấn và Xóa các tài liệu theo điều kiện lọc
   */
  public static async deleteDocsWhere(collectionName: string, fieldName: string, value: any): Promise<boolean> {
    try {
      const colRef = collection(db, collectionName);
      const q = query(colRef, where(fieldName, "==", value));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.forEach(d => {
        batch.delete(d.ref);
      });
      await batch.commit();
      return true;
    } catch (err) {
      console.error(`[FirebaseService] Error batch deleting ${collectionName}:`, err);
      return false;
    }
  }

  /**
   * Xóa toàn bộ tài liệu trong 1 Collection (Clear Collection)
   */
  public static async clearCollection(collectionName: string): Promise<boolean> {
    try {
      const colRef = collection(db, collectionName);
      const snapshot = await getDocs(colRef);
      const batch = writeBatch(db);
      snapshot.forEach(d => {
        batch.delete(d.ref);
      });
      await batch.commit();
      return true;
    } catch (err) {
      console.error(`[FirebaseService] Error clearing ${collectionName}:`, err);
      return false;
    }
  }
}
