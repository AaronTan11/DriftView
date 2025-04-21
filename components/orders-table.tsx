"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Leaf, ArrowUpRight, ArrowDownRight, XCircle, Edit, Loader2 } from "lucide-react"
import { useState } from "react"
import { useDriftStore } from "@/stores/useDriftStore"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export interface Order {
  market: string;
  type: string;
  size: string;
  triggerPrice: string;
  orderId: number;
}

interface OrdersTableProps {
  orders: Order[];
  isLoading?: boolean; 
}

export function OrdersTable({ orders, isLoading }: OrdersTableProps) {
  const driftClient = useDriftStore(state => state.driftClient)
  const activeSubaccountId = useDriftStore(state => state.activeSubaccountId)
  const queryClient = useQueryClient()
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null)

  const handleCancelOrder = async (orderId: number) => {
    if (!driftClient) {
      toast.error("Drift client not available")
      return
    }
    setCancellingOrderId(orderId)
    console.log(orderId)
    console.log(cancellingOrderId)
    try {
      console.log(`Attempting to cancel order ID: ${orderId}`)
      const txSig = await driftClient.cancelOrder(orderId)
      console.log(`Order ${orderId} cancelled successfully. Tx Signature:`, txSig)
      toast.success(
        <div className="flex flex-col">
          <span>Order cancelled successfully!</span>
          <a 
            href={`https://explorer.solana.com/tx/${txSig}?cluster=mainnet-beta`}
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 text-xs mt-1 underline"
          >
            View on Explorer
          </a>
        </div>
      )
      // Invalidate both orders and positions queries
      const ordersQueryKey = ['driftTpSlOrders', driftClient?.wallet?.publicKey?.toString(), activeSubaccountId];
      const positionsQueryKey = ['driftPerpPositionsFormatted', driftClient?.wallet?.publicKey?.toString(), activeSubaccountId];
      console.log("Invalidating orders query with key:", ordersQueryKey);
      console.log("Invalidating positions query with key:", positionsQueryKey);
      await queryClient.invalidateQueries({ queryKey: ordersQueryKey });
      await queryClient.invalidateQueries({ queryKey: positionsQueryKey });
      console.log("Invalidated orders and positions queries.");

    } catch (err: any) {
      console.error(`Error cancelling order ${orderId}:`, err)
      toast.error(`Failed to cancel order: ${err.message || 'Unknown error'}`)
    } finally {
      setCancellingOrderId(null) // Reset loading state for this orderId
    }
  }

  if (isLoading) {
    return <div className="text-center py-4 text-[#5c4f3d]">Loading orders...</div>;
  }
  if (orders.length === 0) {
    return <div className="text-center py-4 text-[#5c4f3d]">No Take Profit or Stop Loss orders found</div>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-[#a7c4bc] bg-[#e8f1f2]">
            {/* Update Columns */}
            <TableHead className="text-[#6d6875]">Market</TableHead>
            <TableHead className="text-[#6d6875]">Type</TableHead>
            <TableHead className="text-[#6d6875]">Size</TableHead>
            <TableHead className="text-[#6d6875]">Trigger Price</TableHead>
            <TableHead className="text-right text-[#6d6875]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order, index) => {
            const isCancelling = cancellingOrderId === order.orderId;
            return (
              <TableRow key={`${order.market}-${order.orderId}-${index}`} className="border-[#a7c4bc] hover:bg-[#f0f7ee]">
                {/* Market */}
                <TableCell className="font-medium text-[#5c4f3d]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#d8e2dc] flex items-center justify-center text-xs text-[#5c4f3d] border border-[#a7c4bc]">
                      <Leaf className="h-4 w-4 text-[#6a994e]" />
                    </div>
                    {order.market}
                  </div>
                </TableCell>
                {/* Type (TP/SL) */}
                <TableCell>
                   <span className="text-[#5c4f3d]">{order.type}</span>
                </TableCell>
                {/* Size */}
                <TableCell className="text-[#5c4f3d]">{order.size}</TableCell>
                {/* Trigger Price */}
                <TableCell className="text-[#5c4f3d]">{order.triggerPrice}</TableCell>
                {/* Actions */}
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => handleCancelOrder(order.orderId)} 
                      disabled={isCancelling}
                      className="text-xs px-3 py-1 bg-[#f28482] hover:bg-[#e07a5f] rounded-full text-[#5c4f3d] border border-[#e07a5f] flex items-center shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCancelling ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {isCancelling ? 'Cancelling...' : 'Cancel'}
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}