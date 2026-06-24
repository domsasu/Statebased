import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { VARIANT_LAYOUTS, LayoutItem, VariantId } from '../config/variantLayouts';

const STORAGE_KEY = 'proto-layout-order';

function loadFromStorage(): Record<VariantId, LayoutItem[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveToStorage(orders: Record<VariantId, LayoutItem[]>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch {}
}

declare global {
  interface Window {
    __getProtoLayouts?: () => Record<VariantId, LayoutItem[]>;
  }
}

type LayoutOrderContextValue = {
  getLayout: (variantId: VariantId) => LayoutItem[];
  reorder: (variantId: VariantId, newItems: LayoutItem[]) => void;
};

const LayoutOrderContext = createContext<LayoutOrderContextValue | null>(null);

export function LayoutOrderProvider({ children }: { children: React.ReactNode }) {
  const [overrides, setOverrides] = useState<Record<VariantId, LayoutItem[]>>(loadFromStorage);

  useEffect(() => {
    window.__getProtoLayouts = () => overrides;
    return () => { delete window.__getProtoLayouts; };
  }, [overrides]);

  const getLayout = useCallback(
    (variantId: VariantId): LayoutItem[] =>
      overrides[variantId] ?? VARIANT_LAYOUTS[variantId] ?? VARIANT_LAYOUTS['a'],
    [overrides],
  );

  const reorder = useCallback((variantId: VariantId, newItems: LayoutItem[]) => {
    setOverrides((prev) => {
      const next = { ...prev, [variantId]: newItems };
      saveToStorage(next);
      return next;
    });
  }, []);

  return (
    <LayoutOrderContext.Provider value={{ getLayout, reorder }}>
      {children}
    </LayoutOrderContext.Provider>
  );
}

export function useLayoutOrder(): LayoutOrderContextValue {
  const ctx = useContext(LayoutOrderContext);
  if (!ctx) throw new Error('useLayoutOrder must be used within LayoutOrderProvider');
  return ctx;
}
