import { openDB, IDBPDatabase } from 'idb';
import { DocumentModel, Party } from '@invoice/core';

const DB_NAME = 'invoice_generator_db';
const DB_VERSION = 1;

interface InvoiceDB {
  documents: {
    key: string;
    value: DocumentModel;
    indexes: {
      'by-type': string;
      'by-status': string;
      'by-updated': string;
    };
  };
  parties: {
    key: string;
    value: Party;
    indexes: {
      'by-name': string;
    };
  };
  settings: {
    key: string;
    value: any;
  };
}

let dbPromise: Promise<IDBPDatabase<InvoiceDB>> | null = null;

// In-memory fallback if IndexedDB is blocked
const memoryStore: {
  documents: Map<string, DocumentModel>;
  parties: Map<string, Party>;
  settings: Map<string, any>;
} = {
  documents: new Map(),
  parties: new Map(),
  settings: new Map(),
};

function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

export function getCurrentOwnerUserId(): string {
  if (typeof window === 'undefined') return 'anon_session';
  const loggedInId = window.localStorage.getItem('billcraft_current_user_id');
  if (loggedInId) return loggedInId;

  let anonId = window.sessionStorage.getItem('billcraft_anon_session_id');
  if (!anonId) {
    anonId = `anon_${Date.now()}`;
    window.sessionStorage.setItem('billcraft_anon_session_id', anonId);
  }
  return anonId;
}

export async function getDB(): Promise<IDBPDatabase<InvoiceDB> | null> {
  if (!isIndexedDBAvailable()) return null;

  if (!dbPromise) {
    dbPromise = openDB<InvoiceDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('documents' as any)) {
          const docStore = db.createObjectStore('documents' as any, { keyPath: 'id' });
          docStore.createIndex('by-type', 'type');
          docStore.createIndex('by-status', 'status');
          docStore.createIndex('by-updated', 'updatedAt');
        }

        if (!db.objectStoreNames.contains('parties' as any)) {
          const partyStore = db.createObjectStore('parties' as any, { keyPath: 'id' });
          partyStore.createIndex('by-name', 'name');
        }

        if (!db.objectStoreNames.contains('settings' as any)) {
          db.createObjectStore('settings' as any, { keyPath: 'key' });
        }
      },
    });
  }

  return dbPromise;
}

// Document operations scoped strictly per user
export async function getAllDocuments(userId?: string): Promise<DocumentModel[]> {
  const targetUser = userId || getCurrentOwnerUserId();
  const db = await getDB();
  const rawList: DocumentModel[] = db
    ? await db.getAll('documents' as any)
    : Array.from(memoryStore.documents.values());

  return rawList
    .filter((doc) => !doc.ownerUserId || doc.ownerUserId === targetUser)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getDocumentById(id: string): Promise<DocumentModel | null> {
  const db = await getDB();
  if (!db) return memoryStore.documents.get(id) || null;
  const doc = await db.get('documents' as any, id);
  return doc || null;
}

export async function saveDocument(document: DocumentModel, userId?: string): Promise<DocumentModel> {
  const ownerUserId = userId || document.ownerUserId || getCurrentOwnerUserId();
  const updatedDoc: DocumentModel = {
    ...document,
    ownerUserId,
    updatedAt: new Date().toISOString(),
  };

  const db = await getDB();
  if (!db) {
    memoryStore.documents.set(updatedDoc.id, updatedDoc);
    return updatedDoc;
  }

  await db.put('documents' as any, updatedDoc);
  return updatedDoc;
}

export async function deleteDocument(id: string): Promise<void> {
  const db = await getDB();
  if (!db) {
    memoryStore.documents.delete(id);
    return;
  }
  await db.delete('documents' as any, id);
}

// Bulk export & import (scoped to current user)
export async function exportLocalDataJson(): Promise<string> {
  const docs = await getAllDocuments();
  return JSON.stringify(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      documents: docs,
    },
    null,
    2
  );
}

export async function importLocalDataJson(jsonString: string): Promise<{
  importedCount: number;
  error?: string;
}> {
  try {
    const data = JSON.parse(jsonString);
    if (!data.documents || !Array.isArray(data.documents)) {
      return { importedCount: 0, error: 'Invalid document backup format.' };
    }

    const ownerUserId = getCurrentOwnerUserId();
    let count = 0;
    for (const doc of data.documents) {
      if (doc.id && doc.type && doc.items) {
        await saveDocument({ ...doc, ownerUserId }, ownerUserId);
        count++;
      }
    }

    return { importedCount: count };
  } catch (err: any) {
    return { importedCount: 0, error: err.message || 'Failed to parse JSON file.' };
  }
}
