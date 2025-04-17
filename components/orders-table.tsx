"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Leaf, ArrowUpRight, ArrowDownRight, XCircle, Edit } from "lucide-react"

interface Order {
  market: string
  side: "BUY" | "SELL"
  size: string
  price: string
  type: string
  status: string
  timeInForce: string
}

interface OrdersTableProps {
  orders: Order[]
}

export function OrdersTable({ orders }: OrdersTableProps) {
  if (orders.length === 0) {
    return <div className="text-center py-4 text-[#5c4f3d]">No orders found</div>
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-[#a7c4bc] bg-[#e8f1f2]">
            <TableHead className="text-[#6d6875]">Market</TableHead>
            <TableHead className="text-[#6d6875]">Side</TableHead>
            <TableHead className="text-[#6d6875]">Size</TableHead>
            <TableHead className="text-[#6d6875]">Price</TableHead>
            <TableHead className="text-[#6d6875]">Type</TableHead>
            <TableHead className="text-[#6d6875]">TIF</TableHead>
            <TableHead className="text-[#6d6875]">Status</TableHead>
            <TableHead className="text-right text-[#6d6875]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order, index) => (
            <TableRow key={index} className="border-[#a7c4bc] hover:bg-[#f0f7ee]">
              <TableCell className="font-medium text-[#5c4f3d]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#d8e2dc] flex items-center justify-center text-xs text-[#5c4f3d] border border-[#a7c4bc]">
                    <Leaf className="h-4 w-4 text-[#6a994e]" />
                  </div>
                  {order.market}
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant={order.side === "BUY" ? "default" : "destructive"}
                  className={
                    order.side === "BUY"
                      ? "bg-[#a7c4bc] text-[#5c4f3d] border border-[#6a994e] font-medium"
                      : "bg-[#f28482] text-[#5c4f3d] border border-[#e07a5f] font-medium"
                  }
                >
                  {order.side === "BUY" ? (
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 mr-1" />
                  )}
                  {order.side}
                </Badge>
              </TableCell>
              <TableCell className="text-[#5c4f3d]">{order.size}</TableCell>
              <TableCell className="text-[#5c4f3d]">{order.price}</TableCell>
              <TableCell className="text-[#5c4f3d]">{order.type}</TableCell>
              <TableCell className="text-[#5c4f3d]">{order.timeInForce}</TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-[#d8e2dc] text-[#5c4f3d] border-[#a7c4bc]">
                  {order.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <button className="text-xs px-3 py-1 bg-[#d8e2dc] hover:bg-[#a7c4bc] rounded-full text-[#5c4f3d] border border-[#a7c4bc] flex items-center shadow-sm transition-colors">
                    <XCircle className="h-3 w-3 mr-1" />
                    Cancel
                  </button>
                  <button className="text-xs px-3 py-1 bg-[#d8e2dc] hover:bg-[#a7c4bc] rounded-full text-[#5c4f3d] border border-[#a7c4bc] flex items-center shadow-sm transition-colors">
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
