import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import {
   initServerSync,
   getAll as serverGetAll,
   create as serverCreate,
   update as serverUpdate,
   remove as serverRemove,
   addSyncListener,
 } from '../repo/syncRepository';

const ExercisesContext = createContext(null);

export function ExercisesProvider({ children }) {
  const [exercises, setExercises] = useState([]);

  useEffect(() => {
    let mounted = true;
    let unsubscribe = null;
    (async () => {
       try {
         // initialize sync (starts DB, net listener, websocket, queue)
         await initServerSync();
         // load canonical data (server if online, otherwise local)
         const rows = await serverGetAll();
         if (mounted) setExercises(rows);

         // subscribe to sync notifications so UI updates immediately on server broadcasts
         unsubscribe = addSyncListener(async () => {
           try {
             const updated = await serverGetAll();
             if (mounted) setExercises(updated);
           } catch (e) {
             console.warn('addSyncListener handler error', e);
           }
          });
       } catch (err) {
         console.error('Sync init/load error', err);
         Alert.alert('Error', 'Failed to initialize sync or load exercises.');
       }
     })();
    return () => { 
      mounted = false; 
      try { if (unsubscribe) unsubscribe(); } catch (e) {}
    };
  }, []);

  const addExercise = useCallback(async (exercise) => {
    try {
      const created = await serverCreate(exercise);      
      setExercises(prev => [created, ...prev]);
      return created.id;
    } catch (err) {
      console.error('Create error', err);
      Alert.alert('Save failed', 'Could not save the exercise.');
      return null;
    }
  }, []);

  const updateExercise = useCallback(async (id, changes) => {
    try {
      const updated = await serverUpdate(id, changes);
       // serverUpdate returns the canonical item (or we use local patch)
       setExercises(prev => prev.map(e => (e.id === id ? { ...e, ...updated } : e)));
    } catch (err) {
      console.error('Update error', err);
      Alert.alert('Update failed', 'Could not update the exercise.');
    }
  }, []);

  const removeExercise = useCallback(async (id) => {
    try {
      await serverRemove(id);
      setExercises(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error('Delete error', err);
      Alert.alert('Delete failed', 'Could not delete the exercise.');
    }
  }, []);

  return (
    <ExercisesContext.Provider value={{ exercises, addExercise, updateExercise, removeExercise }}>
      {children}
    </ExercisesContext.Provider>
  );
}

export function useExercises() {
  const ctx = useContext(ExercisesContext);
  if (!ctx) throw new Error('useExercises must be used inside ExercisesProvider');
  return ctx;
}