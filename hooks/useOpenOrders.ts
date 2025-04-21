'use client';

import { useQuery } from '@tanstack/react-query';
import { useDriftStore } from '@/stores/useDriftStore';
import {
    BN,
    PerpMarkets,
    convertToNumber,
    PRICE_PRECISION,
    BASE_PRECISION,
    Order as SdkOrder,
    isVariant,
    ZERO,
} from '@drift-labs/sdk';
import { type Order } from '@/components/orders-table'; 

const ORACLE_PRICE_PRECISION = PRICE_PRECISION;
const BASE_ASSET_PRECISION = BASE_PRECISION;

export function useOpenOrders(subaccountId: number) {
  const driftClient = useDriftStore(state => state.driftClient);
  const isInitialized = useDriftStore(state => state.isInitialized);

  // Update query key to reflect fetching TP/SL orders
  const queryKey = ['driftTpSlOrders', driftClient?.wallet?.publicKey?.toString(), subaccountId];

  const fetchTpSlOrdersFn = async (): Promise<Order[]> => { // Return type is now Order[]
    if (!driftClient) throw new Error("Drift client not initialized");
    if (subaccountId < 0) throw new Error("Invalid subaccount ID");

    const user = driftClient.getUser(subaccountId);
    if (!user || !user.getUserAccount()) return [];

    const openOrdersSdk: SdkOrder[] = user.getOpenOrders();
    const formattedOrders: Order[] = [];

    // Filter for potential TP/SL orders (Perp Trigger Orders that Reduce Only)
    const potentialTpSlOrders = openOrdersSdk.filter(order =>
        isVariant(order.marketType, 'perp') &&
        (isVariant(order.orderType, 'triggerMarket') || isVariant(order.orderType, 'triggerLimit')) &&
        order.reduceOnly
    );

    for (const order of potentialTpSlOrders) {
      try {
        const marketIndex = order.marketIndex;
        const perpMarketInfo = PerpMarkets['mainnet-beta']?.[marketIndex];
        if (!perpMarketInfo) continue;

        // --- Determine Order Type (TP/SL) ---
        let orderTypeLabel = 'Trigger'; // Default label
        const currentPosition = user.getPerpPosition(marketIndex); // Fetch current position for context

        if (currentPosition && !currentPosition.baseAssetAmount.isZero()) {
            const isLongPosition = currentPosition.baseAssetAmount.gt(ZERO);
            const isTriggerAbove = isVariant(order.triggerCondition, 'above');
            const isOrderSell = isVariant(order.direction, 'short'); // TP/SL should be opposite to position

            if (isLongPosition && isOrderSell) {
                 orderTypeLabel = isTriggerAbove ? 'Take Profit' : 'Stop Loss';
            } else if (!isLongPosition && !isOrderSell) { // Position is Short, Order is Buy
                 orderTypeLabel = isTriggerAbove ? 'Stop Loss' : 'Take Profit';
            }
            // If direction doesn't oppose position, it might be a different kind of trigger
        }
        // --- End Determine Order Type ---

        // Convert size
        const readableSize = convertToNumber(order.baseAssetAmount, BASE_ASSET_PRECISION).toString();
        
        // Convert trigger price
        const triggerPrice = convertToNumber(order.triggerPrice, ORACLE_PRICE_PRECISION).toFixed(2); // Format as needed


        // Ensure the object structure matches the new 'Order' type
        formattedOrders.push({
          market: perpMarketInfo.symbol,
          type: orderTypeLabel, // Use the determined label
          size: readableSize,
          triggerPrice: triggerPrice, // Use the formatted trigger price
          orderId: order.orderId,
        });

      } catch (error) {
        console.error(`Could not process trigger order with id ${order.orderId?.toString()}:`, error);
      }
    }

    formattedOrders.sort((a, b) => a.market.localeCompare(b.market));
    return formattedOrders;
  };

  // useQuery returns Order[]
  return useQuery<Order[], Error>({ 
    queryKey: queryKey,
    queryFn: fetchTpSlOrdersFn,
    enabled: isInitialized && !!driftClient?.wallet?.publicKey && subaccountId >= 0,
  });
}