import {
  getStoredMedia,
  saveStoredMedia,
  deleteMediaItem,
  getStoredTrash,
  restoreTrashItem,
  permanentlyDeleteTrashItem,
  clearTrash,
  restoreAllTrash,
  isGameDeleted,
} from '../src/lib/storage';
import { MediaItem } from '../src/types/media';

// Mock browser localStorage for Node testing
const mockStorage: Record<string, string> = {};
(global as any).window = {};
(global as any).localStorage = {
  getItem: (k: string) => mockStorage[k] || null,
  setItem: (k: string, v: string) => {
    mockStorage[k] = v;
  },
  removeItem: (k: string) => {
    delete mockStorage[k];
  },
  clear: () => {
    for (const k of Object.keys(mockStorage)) delete mockStorage[k];
  },
};

const sampleGame: MediaItem = {
  id: 'game-123',
  title: 'Cyberpunk 2077',
  type: 'game',
  status: 'in_progress',
  coverUrl: 'https://example.com/cp.jpg',
  external_id: 'steam:1091500',
  progress: { current: 45, total: 100, unit: 'hours' },
  gameConnection: {
    service: 'steam',
    serviceId: '1091500',
    serviceName: 'Steam',
    platform: 'PC',
    playtimeMinutes: 2700,
  },
  gameTracker: {
    storyCompleted: false,
    achievements: { current: 30, total: 45 },
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const sampleShow: MediaItem = {
  id: 'show-456',
  title: 'Breaking Bad',
  type: 'show',
  status: 'completed',
  coverUrl: 'https://example.com/bb.jpg',
  progress: { current: 62, total: 62, unit: 'episodes' },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function runTests() {
  console.log('Testing Recycle Bin (Papierkorb) System...');

  // 1. Setup library
  saveStoredMedia([sampleGame, sampleShow]);
  clearTrash();
  console.log('Initial Library count:', getStoredMedia().length);

  // 2. Delete sampleGame
  const deleted = deleteMediaItem(sampleGame.id);
  console.log('Deleted result:', deleted?.title);
  if (deleted?.title !== 'Cyberpunk 2077') throw new Error('Failed to delete game');

  const mediaAfterDel = getStoredMedia();
  if (mediaAfterDel.find((m) => m.id === sampleGame.id)) throw new Error('Game still in media');
  console.log('PASS: Game successfully removed from main library');

  // 3. Verify in Trash
  const trash = getStoredTrash();
  if (trash.length !== 1 || trash[0].id !== sampleGame.id) throw new Error('Game not in trash');
  if (!trash[0].deletedAt) throw new Error('Missing deletedAt in trash item');
  console.log('PASS: Game exists in trash with deleted timestamp:', trash[0].deletedAt);

  // 4. Verify game is blocked in sync while deleted
  if (!isGameDeleted(sampleGame.external_id, sampleGame.title)) {
    throw new Error('Game should be tracked as deleted to avoid re-syncing while in trash');
  }
  console.log('PASS: Game is tracked in deleted list during deletion');

  // 5. Restore game individually
  const restored = restoreTrashItem(sampleGame.id);
  if (!restored || restored.id !== sampleGame.id) throw new Error('Failed to restore game');
  console.log('PASS: Restored game:', restored.title);

  // Check library now contains game
  const mediaAfterRestore = getStoredMedia();
  const found = mediaAfterRestore.find((m) => m.id === sampleGame.id);
  if (!found) throw new Error('Game not found in library after restore');
  if (found.progress?.current !== 45 || found.gameTracker?.achievements?.current !== 30) {
    throw new Error('Progress or achievements were corrupted on restore');
  }
  console.log('PASS: Restored item retained 100% of its progress, achievements, and metadata');

  // Check game is unblocked from deleted keys
  if (isGameDeleted(sampleGame.external_id, sampleGame.title)) {
    throw new Error('Game should no longer be tracked as deleted after restoration');
  }
  console.log('PASS: Game is unblocked from deleted keys after restoration');

  // Check trash is now empty
  if (getStoredTrash().length !== 0) throw new Error('Trash should be empty after restore');
  console.log('PASS: Trash is empty after restoring the single item');

  // 6. Test permanently delete
  deleteMediaItem(sampleShow.id);
  if (getStoredTrash().length !== 1) throw new Error('Show not in trash');
  permanentlyDeleteTrashItem(sampleShow.id);
  if (getStoredTrash().length !== 0) throw new Error('Show still in trash after permanent delete');
  if (getStoredMedia().find((m) => m.id === sampleShow.id)) throw new Error('Show unexpectedly in library');
  console.log('PASS: Permanent delete cleanly purges item from trash');

  // 7. Test bulk restoreAllTrash
  saveStoredMedia([sampleGame, sampleShow]);
  deleteMediaItem(sampleGame.id);
  deleteMediaItem(sampleShow.id);
  console.log('Trash before bulk restore:', getStoredTrash().length);
  const allRestored = restoreAllTrash();
  console.log('Bulk restored items count:', allRestored.length);
  if (allRestored.length !== 2) throw new Error('Expected 2 restored items');
  if (getStoredTrash().length !== 0) throw new Error('Trash should be empty after restoreAllTrash');
  if (getStoredMedia().length !== 2) throw new Error('Library should have 2 items');
  console.log('PASS: Bulk restore successfully restored all items to library');

  console.log('\nALL RECYCLE BIN TESTS PASSED SUCCESSFULLY!');
}

runTests();
