import { useEffect } from 'react';
import { useStore } from '@/state/store';
import { fetchAssembliesFromDB } from '@/utils/assemblies';
export function useInitialize() {
  useEffect(() => {
    const loadAutosave = () => {
      try {
        const saved = localStorage.getItem('autosave');
        if (saved) {
          const projectData = JSON.parse(saved);
          useStore.getState().fromProject(projectData);
        }
      } catch (error) {}
    };
    const loadAssemblies = async () => {
      try {
        const assemblies = await fetchAssembliesFromDB();
        useStore.getState().setAssemblies(assemblies);
      } catch (error) {}
    };
    loadAutosave();
    loadAssemblies();
  }, []);
}
