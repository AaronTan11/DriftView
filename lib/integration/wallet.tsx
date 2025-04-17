"use client";

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import {
    WalletModalProvider,
    WalletDisconnectButton,
    WalletMultiButton
} from '@solana/wallet-adapter-react-ui';

import '@solana/wallet-adapter-react-ui/styles.css';

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
                    <div className="fixed top-4 right-4 flex gap-2">
                        <WalletMultiButton />
                        <WalletDisconnectButton />
                    </div>
                    {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}

export const Wallet = dynamic(
    () => Promise.resolve(WalletComponent),
    { 
        ssr: false,
        loading: () => <div>Loading wallet...</div>
    }
);