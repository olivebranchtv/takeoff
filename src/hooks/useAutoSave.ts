import { useEffect } from 'react';
import { useStore } from '@/state/store';

export function useAutoSave() {
  useEffect(() => {
    const interval = setInterval(() => {
      const state = useStore.getState();
      const projectData = state.toProject();

      try {
        localStorage.setItem('autosave', JSON.stringify(projectData));
        state.setLastSaveTime(Date.now());
      } catch (error) {
        console.error('Autosave failed:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);
}
