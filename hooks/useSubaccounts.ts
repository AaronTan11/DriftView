'use client';

import { useQuery } from '@tanstack/react-query';
import { useDriftStore } from '@/stores/useDriftStore';

interface SubaccountData {
  subaccountId: number;
  name: string;
}

export function useSubaccounts() {
  const driftClient = useDriftStore(state => state.driftClient);
  const isInitialized = useDriftStore(state => state.isInitialized);

  const queryKey = ['driftSubaccounts', driftClient?.wallet?.publicKey?.toString()];


  const fetchSubaccountsFn = async (): Promise<SubaccountData[]> => {
    if (!driftClient) {
      throw new Error("Drift client not initialized"); 
    }

    const nextSubaccountId = await driftClient.getNextSubAccountId();
    const subaccounts: SubaccountData[] = [];

    for (let i = 0; i < nextSubaccountId; i++) {
      try {
        const userAccount = driftClient.getUser(i);
        // Checking if the user account exists and has data
        if (userAccount && userAccount.getUserAccount()) { 
          subaccounts.push({
            subaccountId: i,
            // Decode the name from the byte array, filtering out null terminators (0)
            name: String.fromCharCode(...userAccount.getUserAccount().name.filter(c => c !== 0)),
          });
        }
      } catch (error) {
        continue; 
      }
    }
    
    return subaccounts;
  };


  return useQuery<SubaccountData[], Error>({
    queryKey: queryKey,
    queryFn: fetchSubaccountsFn,
    enabled: isInitialized && !!driftClient?.wallet?.publicKey,
  });
}