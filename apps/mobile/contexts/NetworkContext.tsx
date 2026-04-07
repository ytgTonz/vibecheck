import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

interface NetworkContextValue {
  isConnected: boolean;
  /** true the first time we regain connectivity after being offline */
  didReconnect: boolean;
  /** Call after handling a reconnect so the flag resets */
  clearReconnect: () => void;
}

const NetworkContext = createContext<NetworkContextValue>({
  isConnected: true,
  didReconnect: false,
  clearReconnect: () => {},
});

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(true);
  const [didReconnect, setDidReconnect] = useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const connected = state.isConnected ?? true;

      if (connected && wasOffline.current) {
        setDidReconnect(true);
      }

      wasOffline.current = !connected;
      setIsConnected(connected);
    });

    return () => unsubscribe();
  }, []);

  const clearReconnect = () => setDidReconnect(false);

  return (
    <NetworkContext.Provider value={{ isConnected, didReconnect, clearReconnect }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  return useContext(NetworkContext);
}
