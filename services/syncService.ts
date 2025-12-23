
import { InventoryItem } from '../types';
import { db } from '../db';

const FILE_NAME = 'stock_data_v2.json';
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';

// Note: For personal GitHub Pages use, you must configure your own Client ID in GCP Console.
const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

export class SyncService {
  private static accessToken: string | null = null;
  private static client: any = null;

  static async initialize(onToken: (token: string) => void) {
    if (CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com') {
      console.warn("Sync Service: Google Client ID not configured. Sync will be disabled.");
      return;
    }
    
    return new Promise((resolve) => {
      // @ts-ignore
      if (typeof google === 'undefined') {
        console.error("GSI Client not loaded");
        return resolve(false);
      }
      // @ts-ignore
      this.client = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response: any) => {
          if (response.access_token) {
            this.accessToken = response.access_token;
            onToken(response.access_token);
            resolve(true);
          }
        },
      });
    });
  }

  static signIn() {
    if (this.client) {
      this.client.requestAccessToken();
    } else {
      alert("Please configure your Google Client ID in services/syncService.ts to use Cloud Sync.");
    }
  }

  static async syncWithDrive(): Promise<void> {
    if (!this.accessToken) return;

    try {
      const localItems = await db.getItems();
      const listResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${FILE_NAME}'`,
        { headers: { Authorization: `Bearer ${this.accessToken}` } }
      );
      const list = await listResponse.json();
      const file = list.files && list.files[0];

      if (file) {
        const getResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
          { headers: { Authorization: `Bearer ${this.accessToken}` } }
        );
        const remoteItems: InventoryItem[] = await getResponse.json();

        // Newest lastModified wins merge
        const mergedMap = new Map<string, InventoryItem>();
        [...remoteItems, ...localItems].forEach(item => {
          const existing = mergedMap.get(item.id);
          if (!existing || (item.lastModified || 0) > (existing.lastModified || 0)) {
            mergedMap.set(item.id, item);
          }
        });
        const mergedItems = Array.from(mergedMap.values());
        
        await db.saveItems(mergedItems);
        await this.uploadToDrive(file.id, mergedItems);
      } else {
        await this.createNewFile(localItems);
      }
    } catch (err) {
      console.error("Sync failed:", err);
      throw err;
    }
  }

  private static async createNewFile(items: InventoryItem[]) {
    const metadata = {
      name: FILE_NAME,
      parents: ['appDataFolder']
    };
    
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([JSON.stringify(items)], { type: 'application/json' }));

    await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.accessToken}` },
      body: form
    });
  }

  private static async uploadToDrive(fileId: string, items: InventoryItem[]) {
    await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: { 
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(items)
    });
  }
}
