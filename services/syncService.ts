
import { InventoryItem } from '../types.ts';
import { db } from '../db.ts';

const FILE_NAME = 'stock_data_v2.json';
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';

export class SyncService {
  private static accessToken: string | null = null;
  private static client: any = null;

  static async initialize(onToken: (token: string) => void) {
    const clientId = await db.getClientId();
    
    if (!clientId) {
      console.warn("Sync Service: Google Client ID not found in database. Sync disabled.");
      return;
    }
    
    return new Promise((resolve) => {
      // @ts-ignore
      if (typeof google === 'undefined') {
        console.error("GSI Client not loaded");
        return resolve(false);
      }
      
      try {
        // @ts-ignore
        this.client = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: SCOPES,
          callback: (response: any) => {
            if (response.access_token) {
              this.accessToken = response.access_token;
              onToken(response.access_token);
              resolve(true);
            }
          },
        });
      } catch (err) {
        console.error("GSI Init Error:", err);
        resolve(false);
      }
    });
  }

  static async signIn() {
    if (this.client) {
      this.client.requestAccessToken();
    } else {
      // Re-run initialization in case they just added a key
      await this.initialize(() => {});
      if (this.client) {
        this.client.requestAccessToken();
      } else {
        alert("Please enter your Google Client ID in Settings > Sync Configuration first.");
      }
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
