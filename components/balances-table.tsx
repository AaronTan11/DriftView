"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Cloud, ArrowUpCircle, ArrowDownCircle } from "lucide-react"
import { DepositWithdrawDialog } from "@/components/deposit-withdraw-dialog"

export interface Balance {
  token: string
  amount: string
  value: string
  marketIndex?: number
}

interface BalancesTableProps {
  balances: Balance[]
}

export function BalancesTable({ balances }: BalancesTableProps) {  
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean
    type: 'deposit' | 'withdraw'
    token: string
    marketIndex: number
  } | null>(null)

  if (balances.length === 0) {
    return <div className="text-center py-4 text-[#5c4f3d]">No balances found</div>
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-[#a7c4bc] bg-[#e8f1f2]">
            <TableHead className="text-[#6d6875]">Token</TableHead>
            <TableHead className="text-[#6d6875]">Amount</TableHead>
            <TableHead className="text-right text-[#6d6875]">Value</TableHead>
            <TableHead className="text-right text-[#6d6875]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {balances.map((balance, index) => (
            <TableRow key={index} className="border-[#a7c4bc] hover:bg-[#f0f7ee]">
              <TableCell className="font-medium text-[#5c4f3d]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#d8e2dc] flex items-center justify-center text-xs text-[#5c4f3d] border border-[#a7c4bc]">
                    <Cloud className="h-4 w-4 text-[#6a994e]" />
                  </div>
                  {balance.token}
                </div>
              </TableCell>
              <TableCell className="text-[#5c4f3d]">{balance.amount}</TableCell>
              <TableCell className="text-right text-[#5c4f3d]">{balance.value}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => setDialogState({
                      isOpen: true,
                      type: 'deposit',
                      token: balance.token,
                      marketIndex: balance.marketIndex ?? 0
                    })}
                    className="text-xs px-3 py-1 bg-[#d8e2dc] hover:bg-[#a7c4bc] rounded-full text-[#5c4f3d] border border-[#a7c4bc] flex items-center shadow-sm transition-colors"
                  >
                    <ArrowDownCircle className="h-3 w-3 mr-1" />
                    Deposit
                  </button>
                  <button 
                    onClick={() => setDialogState({
                      isOpen: true,
                      type: 'withdraw',
                      token: balance.token,
                      marketIndex: balance.marketIndex ?? 0
                    })}
                    className="text-xs px-3 py-1 bg-[#d8e2dc] hover:bg-[#a7c4bc] rounded-full text-[#5c4f3d] border border-[#a7c4bc] flex items-center shadow-sm transition-colors"
                  >
                    <ArrowUpCircle className="h-3 w-3 mr-1" />
                    Withdraw
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {dialogState && (
        <DepositWithdrawDialog
          isOpen={dialogState.isOpen}
          onClose={() => setDialogState(null)}
          token={dialogState.token}
          type={dialogState.type}
          marketIndex={dialogState.marketIndex}
        />
      )}
    </div>
  )
}
