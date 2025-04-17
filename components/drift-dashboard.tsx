"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SubaccountSelector } from "@/components/subaccount-selector"
import { BalancesTable } from "@/components/balances-table"
import { PositionsTable } from "@/components/positions-table"
import { OrdersTable } from "@/components/orders-table"
import { Badge } from "@/components/ui/badge"
import { Leaf, Cloud, Wind } from "lucide-react"
import { mockBalances, mockPositions, mockOrders, mockSubaccounts } from "@/lib/mock-data"

export function DriftDashboard() {
  // Temporary Mock data for ui only
  const totalValue = 8524.25
  const totalPnl = 153.75
  const mockWalletAddress = "7Nw3Qa...2uLJ9"
  const activeSubaccountId = 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold font-serif text-[#5c4f3d] flex items-center">
            <Leaf className="h-5 w-5 mr-2 text-[#6a994e]" />
            Subaccounts
          </h2>
          <Badge variant="outline" className="bg-[#d8e2dc] text-[#5c4f3d] border-[#a7c4bc] font-medium">
            Connected: {mockWalletAddress}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SubaccountSelector
          subaccounts={mockSubaccounts}
          selectedSubaccountId={activeSubaccountId}
          onSelectSubaccount={() => {}}
          isLoading={false}
        />

        <div className="flex items-center gap-4 bg-[#d8e2dc] p-3 rounded-lg shadow-md border border-[#a7c4bc]">
          <div className="text-sm text-[#5c4f3d] font-medium">
            <span className="text-[#6d6875]">Total Value:</span> ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-sm font-medium">
            <span className="text-[#6d6875]">PnL:</span> 
            <span className={totalPnl >= 0 ? "text-[#6a994e]" : "text-[#e07a5f]"}>
              {totalPnl >= 0 ? '+' : ''}{totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
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
              <BalancesTable balances={mockBalances} />
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
              <PositionsTable positions={mockPositions} />
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
              <OrdersTable orders={mockOrders} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
