"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowUpCircle, ArrowDownCircle, Loader2 } from "lucide-react"
import { useDriftStore } from "@/stores/useDriftStore"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

interface DepositWithdrawDialogProps {
  isOpen: boolean
  onClose: () => void
  token: string
  type: 'deposit' | 'withdraw'
  marketIndex: number
}

export function DepositWithdrawDialog({
  isOpen,
  onClose,
  token,
  type,
  marketIndex,
}: DepositWithdrawDialogProps) {
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const driftClient = useDriftStore(state => state.driftClient)
  const isInitialized = useDriftStore(state => state.isInitialized)
  const activeSubaccountId = useDriftStore(state => state.activeSubaccountId)
  const queryClient = useQueryClient()

  // Query to ensure client is ready
  const { isLoading: isClientLoading } = useQuery({
    queryKey: ['driftClientReady', driftClient?.wallet?.publicKey?.toString()],
    queryFn: async () => {
      if (!driftClient) throw new Error("Drift client not initialized")
      if (!driftClient.isSubscribed) {
        await driftClient.subscribe()
      }
      return true
    },
    enabled: isInitialized && !!driftClient?.wallet?.publicKey,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!driftClient || !isInitialized) {
      setError("Drift client not initialized")
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      const numAmount = parseFloat(amount)
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error("Please enter a valid amount")
      }

      const preciseAmount = driftClient.convertToSpotPrecision(marketIndex, numAmount)
      const associatedTokenAccount = await driftClient.getAssociatedTokenAccount(marketIndex)

      if (type === 'deposit') {
        await driftClient.deposit(preciseAmount, marketIndex, associatedTokenAccount)
        toast.success("Transaction successful")
      } else {
        await driftClient.withdraw(preciseAmount, marketIndex, associatedTokenAccount)
        toast.success("Transaction successful")
      }
      
      // Force an immediate refetch after deposit/withdraw
      await queryClient.invalidateQueries({ 
        queryKey: ['driftFormattedBalances', driftClient.wallet?.publicKey?.toString(), activeSubaccountId] 
      })

      onClose()
      setAmount("")
    } catch (err: any) {
      console.error('Transaction error:', err)
      // Check for duplicate transaction error
      if (err.message?.includes('already been processed')) {
        await queryClient.invalidateQueries({ 
          queryKey: ['driftFormattedBalances', driftClient.wallet?.publicKey?.toString(), activeSubaccountId] 
        })
        onClose()
        setAmount("")
      } else {
        setError(err.message || "Transaction failed")
        toast.error("Transaction failed")
      }
    } finally {
      setIsLoading(false)
      await queryClient.invalidateQueries({ 
        queryKey: ['driftFormattedBalances', driftClient.wallet?.publicKey?.toString(), activeSubaccountId] 
      }) 
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#f8f9fa] border-[#a7c4bc]">
        <DialogHeader>
          <DialogTitle className="text-[#5c4f3d] font-serif flex items-center gap-2">
            {type === 'deposit' ? (
              <>
                <ArrowDownCircle className="h-5 w-5 text-[#6a994e]" />
                Deposit {token}
              </>
            ) : (
              <>
                <ArrowUpCircle className="h-5 w-5 text-[#6a994e]" />
                Withdraw {token}
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-[#6d6875]">
            Enter the amount you want to {type}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-white border-[#a7c4bc] text-[#5c4f3d]"
              step="any"
              min="0"
              required
            />
            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-[#d8e2dc] hover:bg-[#a7c4bc] text-[#5c4f3d] border-[#a7c4bc]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#6a994e] hover:bg-[#5a8341] text-white"
            >
              {isLoading || isClientLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </>
              ) : (
                type.charAt(0).toUpperCase() + type.slice(1)
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}