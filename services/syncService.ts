
import { InventoryItem } from '../types';
import { db } from '../db';

const FILE_NAME = 'stock_data.json';
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';

// Note: In a real app, this Client ID would be provided via environment variables.
// Users on GitHub Pages would need to configure their own Google Cloud Project.
const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

export class SyncService {
  private static accessToken: string | null = null;
  private static client: any = null;

  static async initialize(onToken: (token: string) => void) {
    return new Promise((resolve) => {
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
    }
  }

  static async syncWithDrive(): Promise<void> {
    if (!this.accessToken) throw new Error('Not signed in');

    const localItems = await db.getItems();
    
    // 1. Find file in appDataFolder
    const listResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${FILE_NAME}'`,
      { headers: { Authorization: `Bearer ${this.accessToken}` } }
    );
    const list = await listResponse.json();
    const file = list.files && list.files[0];

    if (file) {
      // 2. Download remote data
      const getResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
        { headers: { Authorization: `Bearer ${this.accessToken}` } }
      );
      const remoteItems: InventoryItem[] = await getResponse.json();

      // 3. Simple merge logic (Combine and deduplicate by ID, newer lastModified wins)
      const mergedMap = new Map<string, InventoryItem>();
      [...remoteItems, ...localItems].forEach(item => {
        const existing = mergedMap.get(item.id);
        if (!existing || (item.lastModified || 0) > (existing.lastModified || 0)) {
          mergedMap.set(item.id, item);
        }
      });
      const mergedItems = Array.from(mergedMap.values());
      
      // Update local
      await db.saveItems(mergedItems);

      // 4. Upload merged back to Drive
      await this.uploadToDrive(file.id, mergedItems);
    } else {
      // 2. Create new file if it doesn't exist
      await this.createNewFile(localItems);
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
