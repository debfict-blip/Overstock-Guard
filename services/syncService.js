
import { db } from '../db.js';

const FILE_NAME = 'stock_data_v2.json';
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';

export class SyncService {
  static accessToken = null;
  static client = null;

  static async initialize(onToken) {
    const clientId = await db.getClientId();
    if (!clientId) return;
    
    return new Promise((resolve) => {
      if (typeof google === 'undefined') return resolve(false);
      
      try {
        this.client = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: SCOPES,
          callback: (response) => {
            if (response.access_token) {
              this.accessToken = response.access_token;
              onToken(response.access_token);
              resolve(true);
            }
          },
        });
      } catch (err) {
        resolve(false);
      }
    });
  }

  static async signIn() {
    if (this.client) {
      this.client.requestAccessToken();
    } else {
      await this.initialize(() => {});
      if (this.client) this.client.requestAccessToken();
      else alert("Enter Google Client ID in Settings first.");
    }
  }

  static async syncWithDrive() {
    if (!this.accessToken) return;

    try {
      const localItems = await db.getItems();
      const listRes = await fetch(`https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${FILE_NAME}'`, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
      const list = await listRes.json();
      const file = list.files?.[0];

      if (file) {
        const getRes = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
          headers: { Authorization: `Bearer ${this.accessToken}` }
        });
        const remoteItems = await getRes.json();

        const mergedMap = new Map();
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
      throw err;
    }
  }

  static async createNewFile(items) {
    const metadata = { name: FILE_NAME, parents: ['appDataFolder'] };
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([JSON.stringify(items)], { type: 'application/json' }));

    await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.accessToken}` },
      body: form
    });
  }

  static async uploadToDrive(fileId, items) {
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
