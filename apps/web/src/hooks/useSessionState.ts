import { useEffect, useState } from 'react';
import { initializeClientStorage, loadFromStorage, saveToStorage } from '../storage';
import type { UserSession } from '../types';

initializeClientStorage();

export function useSessionState() {
  const [currentSession, setCurrentSession] = useState<UserSession | null>(() => {
    return loadFromStorage<UserSession | null>('zenshin-session', null);
  });

  useEffect(() => {
    saveToStorage('zenshin-session', currentSession);
  }, [currentSession]);

  const logout = () => {
    localStorage.removeItem('zenshin-session');
    setCurrentSession(null);
  };

  return {
    currentSession,
    setCurrentSession,
    logout,
  };
}