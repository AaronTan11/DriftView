"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Wind, ArrowUpRight, ArrowDownRight, XCircle, Loader2 } from "lucide-react"
import { useState } from "react"
import { PerpOrderDialog } from "./perp-order-dialog"
import { Button } from "./ui/button"
import { MainnetPerpMarkets, PositionDirection, BN, OrderType as DriftOrderType, MarketType } from "@drift-labs/sdk"
import { useDriftStore } from "@/stores/useDriftStore"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export interface Position {
  market: string;
  marketIndex: number;
  side: 'Long' | 'Short';
  size: string;
  entryPrice: string;
  markPrice: string;
  pnl: string;
  takeProfitPrice?: string | null; 
  stopLossPrice?: string | null;
  liquidationPrice?: string | null;
  baseAssetAmount: BN;
}

interface PositionsTableProps {
  positions: Position[];
  isLoading?: boolean; 
}

export function PositionsTable({ positions, isLoading }: PositionsTableProps) {
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false)
  const [closingPositionIndex, setClosingPositionIndex] = useState<number | null>(null)
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null)

  const driftClient = useDriftStore(state => state.driftClient)
  const activeSubaccountId = useDriftStore(state => state.activeSubaccountId)
  const queryClient = useQueryClient()

  const handleClosePosition = async (position: Position, index: number) => {
    // Prevent double submission if any close is already in progress
    if (cancellingOrderId !== null) {
      console.warn("Close position already in progress, preventing duplicate call.");
      return;
    }

    if (!driftClient) {
      toast.error("Drift client not available")
      return
    }
    setClosingPositionIndex(index) // Set loading state for this row

    try {
      const direction = position.side === 'Long' ? PositionDirection.SHORT : PositionDirection.LONG;
      const baseAssetAmount = position.baseAssetAmount.abs();
      const marketIndex = position.marketIndex;

      if (baseAssetAmount.isZero()) {
        toast.info("Position size is zero, cannot close.");
        setClosingPositionIndex(null);
        return;
      }

      const orderParams = {
        orderType: DriftOrderType.MARKET, 
        marketType: MarketType.PERP,
        direction: direction,
        baseAssetAmount: baseAssetAmount, 
        reduceOnly: true,
        marketIndex: marketIndex,
      };

      console.log(`Attempting to close position for market ${marketIndex} with params:`, {
        ...orderParams,
        baseAssetAmount: orderParams.baseAssetAmount.toString(),
      });

      const txSig = await driftClient.placePerpOrder(orderParams);
      console.log(`Close position order placed for market ${marketIndex}. Tx Signature:`, txSig);

      toast.success(
        <div className="flex flex-col">
          <span>Close order placed successfully!</span>
          <a 
            href={`https://explorer.solana.com/tx/${txSig}?cluster=mainnet-beta`}
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 text-xs mt-1 underline"
          >
            View on Explorer
          </a>
        </div>
      );

      const positionsQueryKey = ['driftPerpPositionsFormatted', driftClient?.wallet?.publicKey?.toString(), activeSubaccountId];
      console.log("Invalidating positions query with key:", positionsQueryKey);
      await queryClient.invalidateQueries({ queryKey: positionsQueryKey });
      console.log("Invalidated positions query.");

    } catch (err: any) {
      console.error(`Error closing position for market ${position.marketIndex}:`, err);
      let displayError = err.message || "Failed to place close order";
       if (
        displayError.includes("Insufficient collateral") ||
        displayError.includes("0x1773") || 
        displayError.includes("6003") 
      ) {
        displayError = "Insufficient collateral to cover transaction/exchange fees for closing.";
      }
      toast.error(displayError);
    } finally {
      setClosingPositionIndex(null)
    }
  };

  if (isLoading) {
      return <div className="text-center py-4 text-[#5c4f3d]">Loading positions...</div>;
  }

  return (
    <div>
      <div className="flex justify-end mb-4 pr-3">
        <Button 
          onClick={() => setIsOrderDialogOpen(true)}
          className="bg-[#6a994e] hover:bg-[#5a8341] text-white"
        >
          Place Order
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-[#a7c4bc] bg-[#e8f1f2]">
              <TableHead className="text-[#6d6875]">Market</TableHead>
              <TableHead className="text-[#6d6875]">Side</TableHead>
              <TableHead className="text-[#6d6875]">Size</TableHead>
              <TableHead className="text-[#6d6875]">Entry Price</TableHead>
              <TableHead className="text-[#6d6875]">Mark Price</TableHead>
              <TableHead className="text-[#6d6875]">Take Profit</TableHead>
              <TableHead className="text-[#6d6875]">Stop Loss</TableHead>
              <TableHead className="text-[#6d6875]">Liq. Price</TableHead>
              <TableHead className="text-[#6d6875]">PnL</TableHead>
              <TableHead className="text-right text-[#6d6875]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {positions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-4 text-[#5c4f3d]">
                  No open positions found
                </TableCell>
              </TableRow>
            ) : (
              positions.map((position, index) => {
                const isLong = position.side === 'Long';
                const pnlValue = parseFloat(position.pnl.replace(/[^0-9.-]+/g,"")); 
                const pnlColor = pnlValue > 0 ? "text-[#6a994e]" : pnlValue < 0 ? "text-[#e07a5f]" : "text-[#5c4f3d]";
                const isClosing = closingPositionIndex === index;

                return (
                  <TableRow key={`${position.market}-${position.marketIndex}-${index}`} className="border-[#a7c4bc] hover:bg-[#f0f7ee]">
                    <TableCell className="font-medium text-[#5c4f3d]">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#d8e2dc] flex items-center justify-center text-xs text-[#5c4f3d] border border-[#a7c4bc]">
                          <Wind className="h-4 w-4 text-[#6a994e]" />
                        </div>
                        {position.market}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={isLong ? "default" : "destructive"}
                        className={
                          isLong
                            ? "bg-[#a7c4bc] text-[#5c4f3d] border border-[#6a994e] font-medium"
                            : "bg-[#f28482] text-[#5c4f3d] border border-[#e07a5f] font-medium"
                        }
                      >
                        {isLong ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                        {position.side}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#5c4f3d]">{position.size}</TableCell>
                    <TableCell className="text-[#5c4f3d]">{position.entryPrice}</TableCell>
                    <TableCell className="text-[#5c4f3d]">{position.markPrice}</TableCell>
                    <TableCell className="text-[#5c4f3d]">{position.takeProfitPrice ?? '---'}</TableCell>
                    <TableCell className="text-[#5c4f3d]">{position.stopLossPrice ?? '---'}</TableCell>
                    <TableCell className="text-[#5c4f3d]">{position.liquidationPrice ?? '---'}</TableCell>
                    <TableCell className={pnlColor}>
                      {position.pnl}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleClosePosition(position, index)} 
                          disabled={isClosing}
                          className="text-xs px-3 py-1 bg-[#f28482] hover:bg-[#e07a5f] rounded-full text-[#5c4f3d] border border-[#e07a5f] flex items-center shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isClosing ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {isClosing ? 'Closing...' : 'Close'}
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <PerpOrderDialog
        isOpen={isOrderDialogOpen}
        onClose={() => setIsOrderDialogOpen(false)}
      />
    </div>
  )
}