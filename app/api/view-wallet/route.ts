import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { DriftClient, PerpMarkets, SpotMarkets, convertToNumber, PRICE_PRECISION, BASE_PRECISION, QUOTE_PRECISION, ZERO, isVariant, PerpPosition, Order as SdkOrder, User } from '@drift-labs/sdk';
import { convertRawAmountToReadable } from '@/lib/utils';

const ORACLE_PRICE_PRECISION = PRICE_PRECISION;
const PNL_PRECISION = QUOTE_PRECISION;
const BASE_ASSET_PRECISION = BASE_PRECISION;

// Helper function to initialize DriftClient
async function initializeDriftClient(walletAddress: string) {
  const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL!, 'confirmed');
  
  // Create a read-only wallet for viewing
  const wallet = {
    publicKey: new PublicKey(walletAddress),
    signTransaction: async () => { throw new Error('Read-only wallet') },
    signAllTransactions: async () => { throw new Error('Read-only wallet') },
  };

  const driftClient = new DriftClient({
    connection,
    wallet,
    env: 'mainnet-beta',
  });

  await driftClient.subscribe();
  return driftClient;
}

// Helper function to fetch balances for a subaccount
async function fetchBalances(user: User) {
  if (!user || !user.getUserAccount()) return [];

  const userAccount = user.getUserAccount();
  const spotPositions = userAccount.spotPositions;
  const fetchedBalances = [];

  for (const position of spotPositions) {
    const marketIndex = position.marketIndex;
    try {
      const tokenAmount = user.getTokenAmount(marketIndex);
      if (tokenAmount.isZero()) continue;

      const readableAmount = convertRawAmountToReadable(tokenAmount.abs(), marketIndex);
      if (readableAmount === 0) continue;

      const spotMarketInfo = SpotMarkets['mainnet-beta']?.[marketIndex];
      if (!spotMarketInfo) continue;
      
      const decimals = spotMarketInfo.precisionExp.toNumber();

      let value = 0;
      try {
        const oraclePriceData = user.driftClient.getOracleDataForSpotMarket(marketIndex);
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
  }

  // Deduplicate and sort
  const uniqueBalancesMap = new Map();
  fetchedBalances.forEach(balance => {
    uniqueBalancesMap.set(balance.token, balance);
  });
  const deduplicatedBalances = Array.from(uniqueBalancesMap.values());
  deduplicatedBalances.sort((a, b) => 
    parseFloat(b.value.substring(1).replace(/,/g, '')) - parseFloat(a.value.substring(1).replace(/,/g, ''))
  );

  return deduplicatedBalances;
}

// Helper function to fetch positions for a subaccount
async function fetchPositions(user: User) {
  if (!user || !user.getUserAccount()) return [];

  const userAccount = user.getUserAccount();
  const openPerpPositions = userAccount.perpPositions.filter((pos: PerpPosition) => !pos.baseAssetAmount.eq(ZERO));
  const openOrders = user.getOpenOrders();
  const formattedPositions = [];

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
        const oraclePriceData = user.driftClient.getOracleDataForPerpMarket(marketIndex);
        markPrice = convertToNumber(oraclePriceData.price, ORACLE_PRICE_PRECISION);
      } catch { /* ignore */ }

      let pnl = 0;
      try {
        const unrealizedPnlBN = user.getUnrealizedPNL(false, marketIndex);
        pnl = convertToNumber(unrealizedPnlBN, PNL_PRECISION);
      } catch { /* ignore */ }

      // Find TP/SL Orders
      let takeProfitPrice = null;
      let stopLossPrice = null;

      const relevantOrders = openOrders.filter((order: SdkOrder) => 
        order.marketIndex === marketIndex && 
        isVariant(order.marketType, 'perp') &&
        (isVariant(order.orderType, 'triggerMarket') || isVariant(order.orderType, 'triggerLimit')) &&
        order.reduceOnly
      );

      for (const order of relevantOrders) {
        const isOppositeDirection = (isLong && isVariant(order.direction, 'short')) || 
                                  (!isLong && isVariant(order.direction, 'long'));
        
        if (isOppositeDirection) {
          const triggerPrice = convertToNumber(order.triggerPrice, PRICE_PRECISION);
          const triggerConditionAbove = isVariant(order.triggerCondition, 'above');
          
          if ((isLong && triggerConditionAbove) || (!isLong && !triggerConditionAbove)) {
            takeProfitPrice = triggerPrice.toFixed(2);
          } else if ((isLong && !triggerConditionAbove) || (!isLong && triggerConditionAbove)) {
            stopLossPrice = triggerPrice.toFixed(2);
          }
        }
      }

      formattedPositions.push({
        market: perpMarketInfo.symbol,
        side: side,
        size: size.toString(),
        entryPrice: entryPrice.toFixed(2),
        markPrice: markPrice.toFixed(2),
        takeProfitPrice,
        stopLossPrice,
        liquidationPrice: null, // Placeholder
        pnl: pnl.toFixed(2),
      });

    } catch (error) {
      console.error(`Could not process perp position for market ${position.marketIndex}`, error);
    }
  }

  formattedPositions.sort((a, b) => a.market.localeCompare(b.market));
  return formattedPositions;
}

// Helper function to fetch orders for a subaccount
async function fetchOrders(user: User) {
  if (!user || !user.getUserAccount()) return [];

  const openOrdersSdk = user.getOpenOrders();
  const formattedOrders = [];

  const potentialTpSlOrders = openOrdersSdk.filter((order: SdkOrder) =>
    isVariant(order.marketType, 'perp') &&
    (isVariant(order.orderType, 'triggerMarket') || isVariant(order.orderType, 'triggerLimit')) &&
    order.reduceOnly
  );

  for (const order of potentialTpSlOrders) {
    try {
      const marketIndex = order.marketIndex;
      const perpMarketInfo = PerpMarkets['mainnet-beta']?.[marketIndex];
      if (!perpMarketInfo) continue;

      let orderTypeLabel = 'Trigger';
      const currentPosition = user.getPerpPosition(marketIndex);

      if (currentPosition && !currentPosition.baseAssetAmount.isZero()) {
        const isLongPosition = currentPosition.baseAssetAmount.gt(ZERO);
        const isTriggerAbove = isVariant(order.triggerCondition, 'above');
        const isOrderSell = isVariant(order.direction, 'short');

        if (isLongPosition && isOrderSell) {
          orderTypeLabel = isTriggerAbove ? 'Take Profit' : 'Stop Loss';
        } else if (!isLongPosition && !isOrderSell) {
          orderTypeLabel = isTriggerAbove ? 'Stop Loss' : 'Take Profit';
        }
      }

      const readableSize = convertToNumber(order.baseAssetAmount, BASE_ASSET_PRECISION).toString();
      const triggerPrice = convertToNumber(order.triggerPrice, ORACLE_PRICE_PRECISION).toFixed(2);

      formattedOrders.push({
        market: perpMarketInfo.symbol,
        type: orderTypeLabel,
        size: readableSize,
        triggerPrice: triggerPrice,
      });

    } catch (error) {
      console.error(`Could not process trigger order with id ${order.orderId?.toString()}:`, error);
    }
  }

  formattedOrders.sort((a, b) => a.market.localeCompare(b.market));
  return formattedOrders;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    // Initialize Drift client
    const driftClient = await initializeDriftClient(address);

    // Get next subaccount ID to know how many subaccounts to check
    const nextSubaccountId = await driftClient.getNextSubAccountId();
    const subaccounts = [];

    // Fetch data for each subaccount
    for (let i = 0; i < nextSubaccountId; i++) {
      try {
        const user = driftClient.getUser(i);
        if (user && user.getUserAccount()) {
          // Get subaccount data
          const balances = await fetchBalances(user);
          const positions = await fetchPositions(user);
          const orders = await fetchOrders(user);

          subaccounts.push({
            subaccountId: i,
            name: String.fromCharCode(...user.getUserAccount().name.filter(c => c !== 0)),
            balances,
            positions,
            orders,
          });
        }
      } catch (error) {
        console.error(`Error fetching data for subaccount ${i}:`, error);
        continue;
      }
    }

    return NextResponse.json({
      success: true,
      subaccounts,
    });

  } catch (error: any) {
    console.error('Error in view-wallet API:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch wallet data' 
    }, { 
      status: 500 
    });
  }
}
