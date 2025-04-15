'use client';

import { useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useDriftStore } from '@/stores/useDriftStore';

export function DriftClientProvider({ children }: { children: React.ReactNode }) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { initialize, disconnect, error } = useDriftStore();

  useEffect(() => {
    const setupClient = async () => {
      try {
        if (wallet.connected && wallet.publicKey && connection) {
          await initialize(connection, wallet);
        } else {
          await disconnect();
        }
      } catch (err) {
        console.error('Error setting up DriftClient:', err);
      }
    };

    setupClient();

    // Cleanup on unmount or wallet disconnect
    return () => {
      disconnect();
    };
  }, [wallet.connected, wallet.publicKey, connection, initialize, disconnect]);

  // Optionally, you can add error handling UI here
  if (error) {
    console.error('DriftClient Error:', error);
  }

  return <>{children}</>;
} 