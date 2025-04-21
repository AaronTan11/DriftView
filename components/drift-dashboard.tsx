"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SubaccountSelector } from "@/components/subaccount-selector"
import { BalancesTable } from "@/components/balances-table"
import { PositionsTable } from "@/components/positions-table"
import { OrdersTable } from "@/components/orders-table"
import { Badge } from "@/components/ui/badge"
import { Leaf, Cloud, Wind } from "lucide-react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useDriftStore } from "@/stores/useDriftStore"
import { useEffect, useMemo } from "react"
import { useSubaccounts } from "@/hooks/useSubaccounts"
import { useDepositBalances } from "@/hooks/useDepositBalances"
import { usePerpPositions } from "@/hooks/usePerpPositions"
import { useOpenOrders } from "@/hooks/useOpenOrders"

export function DriftDashboard() {
  const { publicKey } = useWallet();
  const { 
    driftClient, 
    activeSubaccountId, 
    switchSubaccount, 
    isConnecting 
  } = useDriftStore();

  const { 
    data: fetchedSubaccounts, 
    isLoading: isLoadingSubaccounts, 
    error: subaccountsError 
  } = useSubaccounts();

  const {
    data: depositAmount,
    isLoading: isLoadingDepositAmount,
    error: depositAmountError
  } = useDepositBalances(activeSubaccountId)
  
  const { 
    data: balancesData, 
    isLoading: isLoadingBalances, 
    error: balancesError 
  } = useDepositBalances(activeSubaccountId); 

  const { 
      data: perpPositionsData, 
      isLoading: isLoadingPerpPositions, 
      error: perpPositionsError 
  } = usePerpPositions(activeSubaccountId); 
  
  const { 
    data: openOrdersData, // Data is now TriggerOrder[]
    isLoading: isLoadingOpenOrders, 
    error: openOrdersError 
} = useOpenOrders(activeSubaccountId); 
  
  const subaccountsForSelector = useMemo(() => {
    return fetchedSubaccounts?.map(sub => ({
      ...sub,
      active: sub.subaccountId === activeSubaccountId
    })) ?? [];
  }, [fetchedSubaccounts, activeSubaccountId]);

  
  const isLoading = isConnecting || isLoadingSubaccounts || isLoadingBalances || isLoadingPerpPositions;

  const queryError = subaccountsError || balancesError || perpPositionsError;

  if (!publicKey) {
    return <div>No wallet connected</div>
  }

  if(!balancesData) {
    return <div>No balances data</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold font-serif text-[#5c4f3d] flex items-center">
            <Leaf className="h-5 w-5 mr-2 text-[#6a994e]" />
          </h2>
          <Badge variant="outline" className="bg-[#d8e2dc] text-[#5c4f3d] border-[#a7c4bc] font-medium">
            Connected: {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SubaccountSelector
          subaccounts={subaccountsForSelector}
          selectedSubaccountId={activeSubaccountId}
          onSelectSubaccount={switchSubaccount}
          isLoading={isConnecting}
        />

      </div> 

      <Tabs defaultValue="balances" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4 bg-[#d8e2dc] rounded-lg">
          <TabsTrigger
            value="balances"
            className="data-[state=active]:bg-[#a7c4bc] data-[state=active]:text-[#5c4f3d] text-[#6d6875] rounded-md"
          >
            <Cloud className="h-4 w-4 mr-2" />
            Balances
          </TabsTrigger>
          <TabsTrigger
            value="positions"
            className="data-[state=active]:bg-[#a7c4bc] data-[state=active]:text-[#5c4f3d] text-[#6d6875] rounded-md"
          >
            <Wind className="h-4 w-4 mr-2" />
            Positions
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            className="data-[state=active]:bg-[#a7c4bc] data-[state=active]:text-[#5c4f3d] text-[#6d6875] rounded-md"
          >
            <Leaf className="h-4 w-4 mr-2" />
            Open Orders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="balances">
          <Card className="bg-[#f8f9fa] border-[#a7c4bc] shadow-lg rounded-xl overflow-hidden pt-0">
            <CardHeader className="bg-[#d8e2dc] border-b border-[#a7c4bc] pt-5">
              <CardTitle className="text-[#5c4f3d] font-serif">Balances</CardTitle>
              <CardDescription className="text-[#6d6875]">
                Your token balances in subaccount {activeSubaccountId}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <BalancesTable balances={balancesData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="positions">
          <Card className="bg-[#f8f9fa] border-[#a7c4bc] shadow-lg rounded-xl overflow-hidden pt-0">
            <CardHeader className="bg-[#d8e2dc] border-b border-[#a7c4bc] pt-5">
              <CardTitle className="text-[#5c4f3d] font-serif">Perpetual Positions</CardTitle>
              <CardDescription className="text-[#6d6875]">
                Your open positions in subaccount {activeSubaccountId}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <PositionsTable 
                positions={perpPositionsData ?? []} 
                isLoading={isLoadingPerpPositions} 
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card className="bg-[#f8f9fa] border-[#a7c4bc] shadow-lg rounded-xl overflow-hidden pt-0">
            <CardHeader className="bg-[#d8e2dc] border-b border-[#a7c4bc] pt-5">
              <CardTitle className="text-[#5c4f3d] font-serif">Open Orders</CardTitle>
              <CardDescription className="text-[#6d6875]">
                Your open orders in subaccount {activeSubaccountId}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <OrdersTable 
                  orders={openOrdersData ?? []} 
                  isLoading={isLoadingOpenOrders} 
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
