import { create } from 'zustand';
import { DriftClient, type DriftClientConfig } from '@drift-labs/sdk';
import { Connection, PublicKey } from '@solana/web3.js';
import type { WalletContextState } from '@solana/wallet-adapter-react';

interface DriftStore {
  driftClient: DriftClient | null;
  isInitialized: boolean;
  isSubscribed: boolean;
  error: Error | null;
  initialize: (connection: Connection, wallet: WalletContextState) => Promise<void>;
  disconnect: () => Promise<void>;
}

export const useDriftStore = create<DriftStore>((set, get) => ({
  driftClient: null,
  isInitialized: false,
  isSubscribed: false,
  error: null,

  initialize: async (connection: Connection, wallet: WalletContextState) => {
    try {
      // Check if wallet is properly connected
      if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
        throw new Error('Wallet not properly connected');
      }

      // Cleanup any existing client
      const currentClient = get().driftClient;
      if (currentClient) {
        await currentClient.unsubscribe();
      }

      // Create a browser-compatible wallet interface
      const driftWallet = {
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction,
        signAllTransactions: wallet.signAllTransactions,
      };

      // Create new DriftClient instance with explicit config
      const newDriftClient = new DriftClient({
        connection,
        wallet: driftWallet,
        env: 'devnet', // or 'mainnet-beta' based on your needs
        opts: {
          commitment: 'confirmed',
          skipPreflight: true,
        },
      });

      // Subscribe to updates
      await newDriftClient.subscribe();

      set({
        driftClient: newDriftClient,
        isInitialized: true,
        isSubscribed: true,
        error: null,
      });
    } catch (err) {
      set({
        error: err as Error,
        isInitialized: false,
        isSubscribed: false,
      });
      console.error('Failed to initialize DriftClient:', err);
    }
  },

  disconnect: async () => {
    try {
      const currentClient = get().driftClient;
      if (currentClient) {
        await currentClient.unsubscribe();
      }
      
      set({
        driftClient: null,
        isInitialized: false,
        isSubscribed: false,
        error: null,
      });
    } catch (err) {
      set({ error: err as Error });
      console.error('Failed to disconnect DriftClient:', err);
    }
  },
})); 