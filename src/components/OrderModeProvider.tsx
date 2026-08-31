"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  readDemoOrderModeFromStorage,
  setDemoOrderModeCookie,
  writeDemoOrderModeToStorage,
} from "@/lib/demo-order-mode";
import {
  resolveOrderMode,
  type OrderMode,
} from "@/lib/order-mode";

type OrderModeContextValue = {
  orderMode: OrderMode;
  demoOverride: OrderMode | null;
  shopCheckoutEnabled: boolean;
  inquiryCatalogMode: boolean;
  hydrated: boolean;
  setOrderMode: (mode: OrderMode) => void;
};

const OrderModeContext = createContext<OrderModeContextValue | null>(null);

export function OrderModeProvider({ children }: { children: ReactNode }) {
  const [demoOverride, setDemoOverride] = useState<OrderMode | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readDemoOrderModeFromStorage();
    if (stored) {
      setDemoOverride(stored);
      setDemoOrderModeCookie(stored);
    }
    setHydrated(true);
  }, []);

  const setOrderMode = useCallback((mode: OrderMode) => {
    setDemoOverride(mode);
    writeDemoOrderModeToStorage(mode);
    setDemoOrderModeCookie(mode);
  }, []);

  const value = useMemo<OrderModeContextValue>(() => {
    const orderMode = resolveOrderMode(demoOverride);
    return {
      orderMode,
      demoOverride,
      shopCheckoutEnabled: orderMode === "shop",
      inquiryCatalogMode: orderMode === "inquiry",
      hydrated,
      setOrderMode,
    };
  }, [demoOverride, hydrated, setOrderMode]);

  return (
    <OrderModeContext.Provider value={value}>{children}</OrderModeContext.Provider>
  );
}

export function useOrderMode(): OrderModeContextValue {
  const context = useContext(OrderModeContext);
  if (!context) {
    const orderMode = resolveOrderMode(null);
    return {
      orderMode,
      demoOverride: null,
      shopCheckoutEnabled: orderMode === "shop",
      inquiryCatalogMode: orderMode === "inquiry",
      hydrated: true,
      setOrderMode: () => {},
    };
  }
  return context;
}
