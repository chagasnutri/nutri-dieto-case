'use client';

import { useState, useEffect } from 'react';

/**
 * Custom Hook genérico para armazenamento reativo e seguro em localStorage (SSR-safe para Next.js / React)
 * @param key Chave de armazenamento no localStorage
 * @param initialValue Valor padrão inicial
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`[useLocalStorage] Erro ao ler rascunho de "${key}":`, error);
      return initialValue;
    }
  });

  // Reavalia caso a chave dinâmica mude (ex: troca de caso ou de aluno)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      } else {
        setStoredValue(initialValue);
      }
    } catch (error) {
      console.warn(`[useLocalStorage] Erro ao carregar "${key}":`, error);
    }
  }, [key]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`[useLocalStorage] Erro ao salvar "${key}":`, error);
    }
  };

  const removeValue = () => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`[useLocalStorage] Erro ao remover "${key}":`, error);
    }
  };

  return [storedValue, setValue, removeValue];
}

export default useLocalStorage;
