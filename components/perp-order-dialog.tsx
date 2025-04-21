import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useDriftStore } from "@/stores/useDriftStore"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { BN, OrderType as DriftOrderType, PositionDirection, MainnetPerpMarkets } from "@drift-labs/sdk"

interface PerpOrderDialogProps {
  isOpen: boolean
  onClose: () => void
}

type OrderType = 'MARKET' | 'LIMIT'
type OrderDirection = 'LONG' | 'SHORT'

// Use the imported static market data
const marketOptions = MainnetPerpMarkets

export function PerpOrderDialog({
  isOpen,
  onClose,
}: PerpOrderDialogProps) {
  const [selectedMarketIndex, setSelectedMarketIndex] = useState<number | undefined>(marketOptions.length > 0 ? marketOptions[0].marketIndex : undefined)
  const [orderType, setOrderType] = useState<OrderType>('MARKET')
  const [direction, setDirection] = useState<OrderDirection>('LONG')
  const [size, setSize] = useState("")
  const [price, setPrice] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const driftClient = useDriftStore(state => state.driftClient)
  const isInitialized = useDriftStore(state => state.isInitialized)
  const activeSubaccountId = useDriftStore(state => state.activeSubaccountId)
  const queryClient = useQueryClient()
  // Reset form state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      console.log("Dialog closed, resetting form state...")
      // Reset selected index based on static data
      if (marketOptions.length > 0) {
        const solMarket = marketOptions.find((m) => m.symbol === "SOL-PERP")
        setSelectedMarketIndex(solMarket ? solMarket.marketIndex : marketOptions[0].marketIndex)
      } else {
        setSelectedMarketIndex(undefined) // No markets in config
      }
      setOrderType('MARKET')
      setDirection('LONG')
      setSize("")
      setPrice("")
      setError(null)
    }
  }, [isOpen])

  // Query to ensure client is ready (still needed for subscription check)
  const { isLoading: isClientLoading } = useQuery({
    queryKey: ['driftClientReady', driftClient?.wallet?.publicKey?.toString()],
    queryFn: async () => {
      if (!driftClient) throw new Error("Drift client not initialized")
      if (!driftClient.isSubscribed) {
        console.log("Checking subscription status... Not subscribed, subscribing now.")
        await driftClient.subscribe()
        console.log("Client subscribed (checked in clientReady query).")
      } else {
        console.log("Client already subscribed (checked in clientReady query).")
      }
      return true
    },
    enabled: isInitialized && !!driftClient?.wallet?.publicKey,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Prevent double submission if already loading
    if (isLoading) {
      console.warn("Place order already in progress, preventing duplicate call.");
      return; 
    }

    if (!driftClient || !isInitialized || selectedMarketIndex === undefined) {
      const errorMsg = !driftClient || !isInitialized ? "Drift client not ready." : "No market selected."
      console.error("Submit validation failed:", errorMsg)
      setError(errorMsg)
      return
    }

    setError(null)
    setIsLoading(true) // Start loading for submit
    console.log(`Attempting to place order for market index: ${selectedMarketIndex}`)

    try {
      const numSize = parseFloat(size)
      if (isNaN(numSize) || numSize <= 0) {
        throw new Error("Please enter a valid size")
      }
      
      const baseAssetAmount = driftClient.convertToPerpPrecision(numSize)
      
      const sdkOrderType = orderType === 'MARKET' ? DriftOrderType.MARKET : DriftOrderType.LIMIT
      const sdkDirection = direction === 'LONG' ? PositionDirection.LONG : PositionDirection.SHORT

      let sdkPrice: BN
      if (orderType === 'LIMIT') {
        const numPrice = parseFloat(price)
        if (isNaN(numPrice) || numPrice <= 0) {
          throw new Error("Please enter a valid price")
        }
        sdkPrice = driftClient.convertToPricePrecision(numPrice)
      } else {
        sdkPrice = new BN(0)
      }

      const orderParams = {
        orderType: sdkOrderType,
        marketIndex: selectedMarketIndex,
        direction: sdkDirection,
        baseAssetAmount: baseAssetAmount,
        price: sdkPrice,
      }

      console.log("Placing order with params:", {
        ...orderParams,
        baseAssetAmount: orderParams.baseAssetAmount.toString(),
        price: orderParams.price.toString(),
        orderType: orderType,
        direction: direction,
      })

      const txSig = await driftClient.placePerpOrder(orderParams)
      console.log("Order placed successfully. Tx Signature:", txSig)
      
      // Re-enable success toast with explorer link
      toast.success(
        <div className="flex flex-col">
          <span>Order placed successfully!</span>
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
      
      onClose()

    } catch (err: any) {
      console.error("Order placement error:", err);

      let displayError = err.message || "Failed to place order"; 

      // Check for specific insufficient collateral error indicators
      if (
        displayError.includes("Insufficient collateral") ||
        displayError.includes("0x1773") || 
        displayError.includes("6003")
      ) {
        displayError = "Insufficient collateral to place this order. Please deposit more funds or reduce the order size.";
      }


      setError(displayError);
      toast.error(displayError); 

    } finally {
      setIsLoading(false)
      const queryKey = ['driftPerpPositionsFormatted', driftClient?.wallet?.publicKey?.toString(), activeSubaccountId];
      console.log("(Finally block) Attempting to invalidate query with key:", queryKey);
      await queryClient.invalidateQueries({ queryKey: queryKey });
      console.log("(Finally block) Invalidated positions query.");
    }
  }

  // Get the label for the currently selected market from static data
  const selectedMarketLabel = marketOptions.find((m) => m.marketIndex === selectedMarketIndex)?.symbol ?? "Select Market"

  // Only client loading matters now for initial readiness
  const isDataLoading = isClientLoading

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#f8f9fa] border-[#a7c4bc]">
        <DialogHeader>
          <DialogTitle className="text-[#5c4f3d] font-serif">
            Place {orderType} {direction} Order
          </DialogTitle>
          <DialogDescription className="text-[#6d6875]">
            {selectedMarketIndex !== undefined ? `${selectedMarketLabel} Perpetual` : "Select Market..."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="market">Market</Label>
            <Select
              value={selectedMarketIndex?.toString() ?? ""}
              onValueChange={(value: string) => {
                console.log(`Market selection changed to index: ${value}`)
                setSelectedMarketIndex(parseInt(value))
              }}
              disabled={isClientLoading || marketOptions.length === 0}
            >
              <SelectTrigger className="bg-white border-[#a7c4bc] text-[#5c4f3d]">
                <SelectValue
                  placeholder={isClientLoading ? "Loading client..." : "Select market"}
                />
              </SelectTrigger>
              <SelectContent>
                {marketOptions.length === 0 ? (
                  <SelectItem value="no-markets" disabled>
                    No markets configured
                  </SelectItem>
                ) : (
                  marketOptions.map((market) => (
                    <SelectItem
                      key={market.marketIndex}
                      value={market.marketIndex.toString()}
                    >
                      {market.symbol}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orderType">Order Type</Label>
              <Select
                value={orderType}
                onValueChange={(value: OrderType) => setOrderType(value)}
              >
                <SelectTrigger className="bg-white border-[#a7c4bc] text-[#5c4f3d]">
                  <SelectValue placeholder="Select order type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MARKET">Market</SelectItem>
                  <SelectItem value="LIMIT">Limit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="direction">Direction</Label>
              <Select
                value={direction}
                onValueChange={(value: OrderDirection) => setDirection(value)}
              >
                <SelectTrigger className="bg-white border-[#a7c4bc] text-[#5c4f3d]">
                  <SelectValue placeholder="Select direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LONG">Long</SelectItem>
                  <SelectItem value="SHORT">Short</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="size">Size</Label>
            <Input
              id="size"
              type="number"
              placeholder="0.00"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="bg-white border-[#a7c4bc] text-[#5c4f3d]"
              step="any"
              min="0"
              required
            />
          </div>

          {orderType === 'LIMIT' && (
            <div className="space-y-2">
              <Label htmlFor="price">Limit Price</Label>
              <Input
                id="price"
                type="number"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="bg-white border-[#a7c4bc] text-[#5c4f3d]"
                step="any"
                min="0"
                required
              />
            </div>
          )}

          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}

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
              disabled={isDataLoading || isLoading || selectedMarketIndex === undefined}
            >
              {isDataLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading
                  Client...
                </>
              ) : isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Placing Order...
                </>
              ) : (
                "Place Order"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 