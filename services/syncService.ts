
/** Sync Service removed in favor of manual CSV data portability */
export class SyncService {
  // Fix: Added optional callback parameter to match App.tsx usage and prevent type error
  static async initialize(onAuthChange?: (token: string | null) => void) {
    if (onAuthChange) {
      onAuthChange(null);
    }
  }
  static async signIn() {}
  static async syncWithDrive() {}
}