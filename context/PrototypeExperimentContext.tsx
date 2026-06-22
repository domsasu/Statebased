import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  PROTO_EXPERIMENT_STORAGE_KEY,
  parsePrototypeExperiment,
  type PrototypeExperimentId,
} from '../config/prototypeToolbar';

interface PrototypeExperimentContextValue {
  experiment: PrototypeExperimentId;
  isExperimentB: boolean;
  setExperiment: (id: PrototypeExperimentId) => void;
}

const PrototypeExperimentContext = createContext<PrototypeExperimentContextValue | null>(null);

function readStoredExperiment(): PrototypeExperimentId {
  try {
    return parsePrototypeExperiment(sessionStorage.getItem(PROTO_EXPERIMENT_STORAGE_KEY));
  } catch {
    return 'a';
  }
}

export const PrototypeExperimentProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [experiment, setExperimentState] = useState<PrototypeExperimentId>(readStoredExperiment);

  const setExperiment = useCallback((id: PrototypeExperimentId) => {
    setExperimentState(id);
    try {
      sessionStorage.setItem(PROTO_EXPERIMENT_STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
    window.PrototypeToolbar?.setExperiment(id);
  }, []);

  useEffect(() => {
    const onChanged = (e: Event) => {
      const id = (e as CustomEvent<{ id: string }>).detail?.id;
      setExperimentState(parsePrototypeExperiment(id ?? null));
    };
    window.addEventListener('experiment-changed', onChanged);
    return () => window.removeEventListener('experiment-changed', onChanged);
  }, []);

  const value = useMemo(
    () => ({
      experiment,
      isExperimentB: experiment === 'b',
      setExperiment,
    }),
    [experiment, setExperiment]
  );

  return (
    <PrototypeExperimentContext.Provider value={value}>
      {children}
    </PrototypeExperimentContext.Provider>
  );
};

export function usePrototypeExperiment(): PrototypeExperimentContextValue {
  const ctx = useContext(PrototypeExperimentContext);
  if (!ctx) {
    throw new Error('usePrototypeExperiment must be used within PrototypeExperimentProvider');
  }
  return ctx;
}
