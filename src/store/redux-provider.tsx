"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { persistor, store } from "./store";

export function ReduxProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef(store);

  useEffect(() => {
    // Ensure persistor has started for client-only navigation
    void persistor.persist();
  }, []);

  return (
    <Provider store={storeRef.current}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}
