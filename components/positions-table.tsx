"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Wind, ArrowUpRight, ArrowDownRight, XCircle, Edit } from "lucide-react"

interface Position {
  market: string
  size: string
  entryPrice: string
  markPrice: string
  pnl: string
  leverage: string
  liquidationPrice: string
}

interface PositionsTableProps {
  positions: Position[]
}

export function PositionsTable({ positions }: PositionsTableProps) {
  if (positions.length === 0) {
    return <div className="text-center py-4 text-[#5c4f3d]">No positions found</div>
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-[#a7c4bc] bg-[#e8f1f2]">
            <TableHead className="text-[#6d6875]">Market</TableHead>
            <TableHead className="text-[#6d6875]">Size</TableHead>
            <TableHead className="text-[#6d6875]">Entry Price</TableHead>
            <TableHead className="text-[#6d6875]">Mark Price</TableHead>
            <TableHead className="text-[#6d6875]">Liq. Price</TableHead>
            <TableHead className="text-[#6d6875]">PnL</TableHead>
            <TableHead className="text-[#6d6875]">Leverage</TableHead>
            <TableHead className="text-right text-[#6d6875]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {positions.map((position, index) => {
            const isLong = !position.size.startsWith("-")

            return (
              <TableRow key={index} className="border-[#a7c4bc] hover:bg-[#f0f7ee]">
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
                    {position.size}
                  </Badge>
                </TableCell>
                <TableCell className="text-[#5c4f3d]">{position.entryPrice}</TableCell>
                <TableCell className="text-[#5c4f3d]">{position.markPrice}</TableCell>
                <TableCell className="text-[#5c4f3d]">{position.liquidationPrice}</TableCell>
                <TableCell className={position.pnl.startsWith("+") ? "text-[#6a994e]" : "text-[#e07a5f]"}>
                  {position.pnl}
                </TableCell>
                <TableCell className="text-[#5c4f3d]">{position.leverage}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <button className="text-xs px-3 py-1 bg-[#d8e2dc] hover:bg-[#a7c4bc] rounded-full text-[#5c4f3d] border border-[#a7c4bc] flex items-center shadow-sm transition-colors">
                      <XCircle className="h-3 w-3 mr-1" />
                      Close
                    </button>
                    <button className="text-xs px-3 py-1 bg-[#d8e2dc] hover:bg-[#a7c4bc] rounded-full text-[#5c4f3d] border border-[#a7c4bc] flex items-center shadow-sm transition-colors">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
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
