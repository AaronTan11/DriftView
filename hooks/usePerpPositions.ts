// hooks/usePerpPositions.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { useDriftStore } from '@/stores/useDriftStore';
import { 
    PerpMarkets, 
    convertToNumber, 
    PRICE_PRECISION, 
    BASE_PRECISION, 
    QUOTE_PRECISION,
    ZERO,
    isVariant, 
} from '@drift-labs/sdk'; 
import { Position } from '@/components/positions-table'; 

const ORACLE_PRICE_PRECISION = PRICE_PRECISION; 
const PNL_PRECISION = QUOTE_PRECISION; 
const BASE_ASSET_PRECISION = BASE_PRECISION; 

export function usePerpPositions(subaccountId: number) {
  const driftClient = useDriftStore(state => state.driftClient);
  const isInitialized = useDriftStore(state => state.isInitialized);
  
  const queryKey = ['driftPerpPositionsFormatted', driftClient?.wallet?.publicKey?.toString(), subaccountId];

  const fetchPerpPositionsFn = async (): Promise<Position[]> => { // Return type is Position[]
    if (!driftClient) throw new Error("Drift client not initialized");
    if (subaccountId < 0) throw new Error("Invalid subaccount ID");

    const user = driftClient.getUser(subaccountId);
    if (!user || !user.getUserAccount()) return [];

    const userAccount = user.getUserAccount();
    const openPerpPositions = userAccount.perpPositions.filter(pos => !pos.baseAssetAmount.eq(ZERO));
    
    // Fetch all open orders once for efficiency
    const openOrders = user.getOpenOrders(); 
    
    const formattedPositions: Position[] = [];

    for (const position of openPerpPositions) {
      try {
        const marketIndex = position.marketIndex;
        const perpMarketInfo = PerpMarkets['mainnet-beta']?.[marketIndex];
        if (!perpMarketInfo) continue;

        const baseAssetAmount = position.baseAssetAmount;
        const isLong = baseAssetAmount.gt(ZERO);
        const side = isLong ? 'Long' : 'Short';
        const size = convertToNumber(baseAssetAmount.abs(), BASE_ASSET_PRECISION);

        let entryPrice = 0;
        if (!baseAssetAmount.isZero()) {
          const quoteEntryAmount = position.quoteEntryAmount;
          const entryPriceBN = quoteEntryAmount.mul(BASE_ASSET_PRECISION).div(baseAssetAmount);
          entryPrice = convertToNumber(entryPriceBN, QUOTE_PRECISION);
        }

        let markPrice = 0;
        try {
          const oraclePriceData = driftClient.getOracleDataForPerpMarket(marketIndex);
          markPrice = convertToNumber(oraclePriceData.price, ORACLE_PRICE_PRECISION);
        } catch { /* ignore */ }

        let pnl = 0;
        try {
          const unrealizedPnlBN = user.getUnrealizedPNL(false, marketIndex);
          pnl = convertToNumber(unrealizedPnlBN, PNL_PRECISION);
        } catch { /* ignore */ }

        // --- Find TP/SL Orders ---
        let takeProfitPrice: string | null = null;
        let stopLossPrice: string | null = null;

        const relevantOrders = openOrders.filter(order => 
            order.marketIndex === marketIndex && 
            isVariant(order.marketType, 'perp') &&
            (isVariant(order.orderType, 'triggerMarket') || isVariant(order.orderType, 'triggerLimit')) &&
            order.reduceOnly 
        );

        for (const order of relevantOrders) {
            // TP Condition: Opposite direction, trigger price is favorable
            // SL Condition: Opposite direction, trigger price is unfavorable
            const isOppositeDirection = (isLong && isVariant(order.direction, 'short')) || (!isLong && isVariant(order.direction, 'long'));
            
            if (isOppositeDirection) {
                const triggerPrice = convertToNumber(order.triggerPrice, PRICE_PRECISION);
                const triggerConditionAbove = isVariant(order.triggerCondition, 'above');
                
                // Take Profit logic
                if ((isLong && triggerConditionAbove) || (!isLong && !triggerConditionAbove)) {
                    takeProfitPrice = triggerPrice.toFixed(2); // Simple assignment, could find the 'best' one if multiple
                }
                // Stop Loss logic
                else if ((isLong && !triggerConditionAbove) || (!isLong && triggerConditionAbove)) {
                    stopLossPrice = triggerPrice.toFixed(2); // Simple assignment
                }
            }
        }

        const liquidationPrice: string | null = null; 

        const priceDecimals = 2; 

        formattedPositions.push({
          market: perpMarketInfo.symbol,
          marketIndex: marketIndex,
          side: side,
          size: size.toString(), 
          entryPrice: entryPrice.toFixed(priceDecimals), 
          markPrice: markPrice.toFixed(priceDecimals), 
          takeProfitPrice: takeProfitPrice, // Assign found TP or null
          stopLossPrice: stopLossPrice,     // Assign found SL or null
          liquidationPrice: liquidationPrice, // Assign placeholder or null
          pnl: pnl.toFixed(2), // Format PNL
          baseAssetAmount: baseAssetAmount // Include raw baseAssetAmount
        });

      } catch (error) {
        console.error(`Could not process perp position for market ${position.marketIndex}`, error);
      }
    }

    formattedPositions.sort((a, b) => a.market.localeCompare(b.market));
    return formattedPositions;
  };

  return useQuery<Position[], Error>({ // Ensure return type matches table's interface
    queryKey: queryKey,
    queryFn: fetchPerpPositionsFn,
    enabled: isInitialized && !!driftClient?.wallet?.publicKey && subaccountId >= 0,
    refetchInterval: 3000, // Refetch every 5 seconds
    staleTime: 3000, // Stale time of 5 seconds
  });
}