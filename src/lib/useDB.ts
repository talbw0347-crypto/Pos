import { useCallback, useEffect, useRef, useState } from 'react';
import type { DB } from './types';
import { loadDB, saveDB } from './storage';

export function useDB() {
  const [db, setDb] = useState<DB>(() => loadDB());
  const dbRef = useRef(db);
  dbRef.current = db;

  useEffect(() => {
    saveDB(db);
  }, [db]);

  const update = useCallback((mut: (draft: DB) => DB) => {
    setDb((prev) => mut(prev));
  }, []);

  return { db, update, dbRef };
}
