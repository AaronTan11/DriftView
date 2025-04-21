"use client"
import { create } from "zustand"
import {Connection} from "@solana/web3.js";
import { DriftClient } from "@drift-labs/sdk";
import { tryCatch } from "@/lib/try-catch";

interface DriftStore {
  // Client state
  driftClient: DriftClient | null;
  connection: Connection | null;
  isInitialized: boolean;
  isConnecting: boolean;
  error: Error | null;
  
  // Subaccount state
  activeSubaccountId: number;
  subaccounts: Array<{
    subaccountId: number;
    name: string;
    active: boolean;
  }>;
  
  // Actions
  initialize: (wallet: any) => Promise<void>;
  disconnect: () => void;
  switchSubaccount: (subaccountId: number) => Promise<void>;
  fetchSubaccounts: () => Promise<void>;

}



export const useDriftStore = create<DriftStore>((set, get) => ({
  driftClient: null,
  connection: null,
  isInitialized: false,
  isConnecting: false,
  error: null,
  activeSubaccountId: 0,
  subaccounts: [],

  initialize: async (wallet: any) => {
    set({isConnecting: true, error: null});

    const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL!, 'confirmed');
    const driftClient = new DriftClient({
      connection,
      wallet,
      env: 'mainnet-beta',
    });

    const { data, error } = await tryCatch(driftClient.subscribe());
    if (error) {
      set({error: error, isConnecting: false});
      return;
    }

    set({
      driftClient,
      connection,
      isInitialized: true,
      isConnecting: false,
    });
  },

  disconnect: () => {
    set({driftClient: null, connection: null, isInitialized: false});
  },

  switchSubaccount: async (subaccountId: number) => {
    const driftClient = get().driftClient;
    if (!driftClient) return;
    const {data: isSwitched, error: switchError} = await tryCatch(driftClient.switchActiveUser(subaccountId));
    if (switchError) {
      set({error: switchError, isConnecting: false});
      return;
    }
    set({activeSubaccountId: subaccountId});
  },
  fetchSubaccounts: async () => {
    const driftClient = get().driftClient;
    if (!driftClient) return;

    const fetchSubaccountsLogic = async () => {
      const nextSubaccountId = await driftClient.getNextSubAccountId();
      const subaccounts = [];
      
      for (let i = 0; i < nextSubaccountId; i++) {
        try {
          const userAccount = driftClient.getUser(i);
          if (userAccount && userAccount.getUserAccount()) {
            subaccounts.push({
              subaccountId: i,
              name: String.fromCharCode(...userAccount.getUserAccount().name.filter(c => c !== 0)),
              active: i === get().activeSubaccountId
            });
          }
        } catch (error) {
          continue; // Skip if this iteration of subaccount doesn't exist
        }
      }
      
      return subaccounts;
    };
    
    const { data, error } = await tryCatch(fetchSubaccountsLogic());
    if (error) {
      set({error: error, isConnecting: false});
      return;
    }
    set({subaccounts: data});
  }
}))