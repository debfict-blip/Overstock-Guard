
/** Sync Service removed in favor of manual CSV data portability */
export class SyncService {
  // Fix: Added callback parameter to match App.js usage and prevent runtime errors
  static async initialize(onAuthChange) {
    if (onAuthChange) {
      onAuthChange(null);
    }
  }
  static async signIn() {}
  static async syncWithDrive() {}
}