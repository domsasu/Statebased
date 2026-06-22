import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  AI_SUMMARY_DEFAULT_STATE,
  parseAiSummaryActivityState,
  type AiSummaryActivityStateId,
} from '../config/aiSummaryActivityStates';
import { PROTO_AI_SUMMARY_STATE_EVENT, PROTO_REPLAY_AI_SUMMARY_EVENT } from '../config/prototypeToolbar';

interface AiSummaryActivityContextValue {
  activityStateId: AiSummaryActivityStateId;
  setActivityStateId: (id: AiSummaryActivityStateId, opts?: { animate?: boolean }) => void;
  /** When true, the next time the card starts it runs the analyzing → typewriter sequence. */
  playEntranceAnimation: boolean;
  clearEntranceAnimation: () => void;
}

const AiSummaryActivityContext = createContext<AiSummaryActivityContextValue | null>(null);

export const AiSummaryActivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activityStateId, setActivityStateIdState] = useState<AiSummaryActivityStateId>(
    AI_SUMMARY_DEFAULT_STATE
  );
  const [playEntranceAnimation, setPlayEntranceAnimation] = useState(false);

  const setActivityStateId = useCallback(
    (id: AiSummaryActivityStateId, opts?: { animate?: boolean }) => {
      setActivityStateIdState(id);
      setPlayEntranceAnimation(opts?.animate ?? false);
    },
    []
  );

  const clearEntranceAnimation = useCallback(() => {
    setPlayEntranceAnimation(false);
  }, []);

  useEffect(() => {
    const onState = (e: Event) => {
      const id = (e as CustomEvent<{ stateId: string }>).detail?.stateId;
      setActivityStateId(parseAiSummaryActivityState(id ?? null), { animate: false });
    };
    const onReplay = () => {
      setPlayEntranceAnimation(true);
    };
    window.addEventListener(PROTO_AI_SUMMARY_STATE_EVENT, onState);
    window.addEventListener(PROTO_REPLAY_AI_SUMMARY_EVENT, onReplay);
    return () => {
      window.removeEventListener(PROTO_AI_SUMMARY_STATE_EVENT, onState);
      window.removeEventListener(PROTO_REPLAY_AI_SUMMARY_EVENT, onReplay);
    };
  }, [setActivityStateId]);

  const value = useMemo(
    () => ({ activityStateId, setActivityStateId, playEntranceAnimation, clearEntranceAnimation }),
    [activityStateId, setActivityStateId, playEntranceAnimation, clearEntranceAnimation]
  );

  return (
    <AiSummaryActivityContext.Provider value={value}>{children}</AiSummaryActivityContext.Provider>
  );
};

export function useAiSummaryActivity(): AiSummaryActivityContextValue {
  const ctx = useContext(AiSummaryActivityContext);
  if (!ctx) {
    throw new Error('useAiSummaryActivity must be used within AiSummaryActivityProvider');
  }
  return ctx;
}
