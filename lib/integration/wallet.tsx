"use client";

import dynamic from 'next/dynamic';
import { useEffect, useMemo } from 'react';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import {
    WalletModalProvider,
    WalletDisconnectButton,
    WalletMultiButton
} from '@solana/wallet-adapter-react-ui';

import '@solana/wallet-adapter-react-ui/styles.css';
import { useDriftStore } from '@/stores/useDriftStore';

function WalletComponent({ children }: { children: React.ReactNode }) {
    const network = WalletAdapterNetwork.Mainnet;
    const endpoint = process.env.NEXT_PUBLIC_RPC_URL;
    
    if (!endpoint) {
        throw new Error('NEXT_PUBLIC_RPC_URL environment variable is not set');
    }

    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
        ],
        []
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <div className="fixed top-4 right-4 flex gap-2 z-50">
                        <WalletMultiButton style={{ borderRadius: '10px', backgroundColor: '#5c4f3d', color: 'white', fontSize: '16px' }} />
                        <WalletDisconnectButton style={{ borderRadius: '10px', backgroundColor: '#5c4f3d', color: 'white', fontSize: '16px' }} />
                    </div>
                    <DriftInitializer>
                        {children}
                    </DriftInitializer>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}

function DriftInitializer({ children }: { children: React.ReactNode }) {
  const { publicKey, wallet, connected } = useWallet();
  const { initialize, disconnect, isInitialized } = useDriftStore();
  
  // This watches for wallet connection changes
  useEffect(() => {
    // wallet is connected but client isn't initialized
    if (connected && wallet && !isInitialized) {
      initialize(wallet.adapter);
    }
    
    // wallet is disconnected but client is still initialized
    if (!connected && isInitialized) {
      disconnect();
    }
    
    return () => {
      if (isInitialized) {
        disconnect();
      }
    };
  }, [connected, wallet, isInitialized]);
  
  return <>{children}</>;
}

export const Wallet = dynamic(
    () => Promise.resolve(WalletComponent),
    { 
        ssr: false,
        loading: () => <div>Loading wallet...</div>
    }
);