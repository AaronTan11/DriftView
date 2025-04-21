// hooks/useDepositBalances.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { useDriftStore } from '@/stores/useDriftStore';
import { BN, SpotMarkets, PRICE_PRECISION, convertToNumber } from '@drift-labs/sdk';
import { convertRawAmountToReadable } from '@/lib/utils';
import { type Balance } from '@/components/balances-table';


export function useDepositBalances(subaccountId: number) {
  const driftClient = useDriftStore(state => state.driftClient);
  const isInitialized = useDriftStore(state => state.isInitialized);

  const queryKey = ['driftFormattedBalances', driftClient?.wallet?.publicKey?.toString(), subaccountId];

  const fetchFormattedBalancesFn = async (): Promise<Balance[]> => {
    if (!driftClient) throw new Error("Drift client not initialized");
    if (subaccountId < 0) throw new Error("Invalid subaccount ID");

    const user = driftClient.getUser(subaccountId);
    if (!user || !user.getUserAccount()) return [];

    const userAccount = user.getUserAccount();
    const spotPositions = userAccount.spotPositions;
    const fetchedBalances: Balance[] = [];

    await Promise.all(spotPositions.map(async (position) => {
      const marketIndex = position.marketIndex;
      try {
        const tokenAmount = user.getTokenAmount(marketIndex);
        if (tokenAmount.isZero()) return;

        const readableAmount = convertRawAmountToReadable(tokenAmount.abs(), marketIndex);
        if (readableAmount === 0) return;

        const spotMarketInfo = SpotMarkets['mainnet-beta']?.[marketIndex];
        if (!spotMarketInfo) return;
        const decimals = spotMarketInfo.precisionExp.toNumber();

        let value = 0;
        try {
          const oraclePriceData = driftClient.getOracleDataForSpotMarket(marketIndex);
          // Convert oracle price BN using its precision
          const price = convertToNumber(oraclePriceData.price, PRICE_PRECISION);
          value = readableAmount * price;
        } catch (priceError) {
          console.error(`Could not process price for market ${marketIndex}`, priceError);
        }

        fetchedBalances.push({
          token: spotMarketInfo.symbol,
          amount: readableAmount.toFixed(decimals),
          value: `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        });
      } catch (error) {
        console.error(`Could not process balance for market ${marketIndex}`, error);
      }
    }));

    //Deduplication due to duplicate entries of same token with same values
    const uniqueBalancesMap = new Map<string, Balance>();
    fetchedBalances.forEach(balance => {
      uniqueBalancesMap.set(balance.token, balance);
    });
    const deduplicatedBalances = Array.from(uniqueBalancesMap.values());


    // Sort by value descending
    deduplicatedBalances.sort((a, b) => parseFloat(b.value.substring(1).replace(/,/g, '')) - parseFloat(a.value.substring(1).replace(/,/g, '')));
    return deduplicatedBalances;
  };

  return useQuery<Balance[], Error>({
    queryKey: queryKey,
    queryFn: fetchFormattedBalancesFn,
    enabled: isInitialized && !!driftClient?.wallet?.publicKey && subaccountId >= 0,
  });
}