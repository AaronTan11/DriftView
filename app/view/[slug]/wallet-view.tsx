"use client"

import React, { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { BalancesTable, Balance } from "@/components/balances-table"
import { PositionsTable, Position } from "@/components/positions-table"
import { OrdersTable, Order } from "@/components/orders-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Cloud, Wind, Leaf, AlertTriangle, Ban } from "lucide-react"
import { PublicKey } from "@solana/web3.js"
import { useWalletStore } from "@/stores/useWalletStore"

interface SubaccountData {
  subaccountId: number
  name: string
  balances: Balance[]
  positions: Position[]
  orders: Order[]
}

interface ApiResponse {
  success: boolean
  subaccounts: SubaccountData[]
}

async function fetchWalletData(address: string): Promise<ApiResponse> {
  if (!address) throw new Error("No wallet address provided")
  
  try {
    new PublicKey(address)
  } catch {
    throw new Error("Invalid wallet address format")
  }

  const response = await fetch(`/api/view-wallet?address=${address}`)
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || `Failed to fetch data: ${response.statusText}`)
  }
  return response.json()
}

export function WalletView() {
  const params = useParams()
  const slug = params.slug as string | undefined
  const { walletAddress } = useWalletStore()
  const [selectedSubaccountId, setSelectedSubaccountId] = useState<number>(0)

  const { data, error, isLoading } = useQuery<ApiResponse, Error>({
    queryKey: ['walletData', walletAddress || slug],
    queryFn: () => fetchWalletData(walletAddress || slug || ''),
    enabled: !!(walletAddress || slug),
    retry: false,
  })

  useEffect(() => {
    if (data?.success && Array.isArray(data.subaccounts) && data.subaccounts.length > 0) {
      setSelectedSubaccountId(data.subaccounts[0].subaccountId)
    }
  }, [data])

  if (!slug && !walletAddress) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        Enter a wallet address above to view data.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-10 w-full mb-4" />
        <Card className="bg-card border-border shadow-lg rounded-xl overflow-hidden pt-0">
          <CardHeader className="bg-secondary border-b border-border pt-5">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/2 mt-1" />
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  const subaccounts = data?.subaccounts || [{
    subaccountId: 0,
    name: "Default",
    balances: [],
    positions: [],
    orders: []
  }]

  const selectedSubaccount = subaccounts.find(s => s.subaccountId === selectedSubaccountId) || subaccounts[0]

  const EmptyState = ({ type }: { type: string }) => (
    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
      <Ban className="h-12 w-12 mb-3 opacity-20" />
      <p className="text-sm">No {type} data available</p>
      {error && <p className="text-xs mt-1 text-destructive">{error.message}</p>}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-foreground font-serif break-all">
          Data for: <span className="font-mono text-sm text-muted-foreground">{walletAddress || slug}</span>
        </h2>
        
        {subaccounts.length > 1 && (
          <div className="flex gap-2">
            {subaccounts.map((subaccount) => (
              <button
                key={subaccount.subaccountId}
                onClick={() => setSelectedSubaccountId(subaccount.subaccountId)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedSubaccountId === subaccount.subaccountId
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {subaccount.name || `Subaccount ${subaccount.subaccountId}`}
              </button>
            ))}
          </div>
        )}
      </div>

      <Tabs defaultValue="balances" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4 bg-secondary rounded-lg">
          <TabsTrigger value="balances" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-muted-foreground rounded-md">
            <Cloud className="h-4 w-4 mr-2" /> Balances ({selectedSubaccount.balances.length})
          </TabsTrigger>
          <TabsTrigger value="positions" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-muted-foreground rounded-md">
            <Wind className="h-4 w-4 mr-2" /> Positions ({selectedSubaccount.positions.length})
          </TabsTrigger>
          <TabsTrigger value="orders" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-muted-foreground rounded-md">
            <Leaf className="h-4 w-4 mr-2" /> Orders ({selectedSubaccount.orders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="balances">
          <Card className="bg-card border-border shadow-lg rounded-xl overflow-hidden pt-0">
            <CardHeader className="bg-secondary border-b border-border pt-5">
              <CardTitle className="text-card-foreground font-serif">Balances</CardTitle>
              <CardDescription className="text-muted-foreground">
                Subaccount {selectedSubaccount.subaccountId}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {selectedSubaccount.balances.length > 0 ? (
                <BalancesTable balances={selectedSubaccount.balances} />
              ) : (
                <EmptyState type="balance" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="positions">
          <Card className="bg-card border-border shadow-lg rounded-xl overflow-hidden pt-0">
            <CardHeader className="bg-secondary border-b border-border pt-5">
              <CardTitle className="text-card-foreground font-serif">Perpetual Positions</CardTitle>
              <CardDescription className="text-muted-foreground">
                Subaccount {selectedSubaccount.subaccountId}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {selectedSubaccount.positions.length > 0 ? (
                <PositionsTable positions={selectedSubaccount.positions} isLoading={false} />
              ) : (
                <EmptyState type="position" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card className="bg-card border-border shadow-lg rounded-xl overflow-hidden pt-0">
            <CardHeader className="bg-secondary border-b border-border pt-5">
              <CardTitle className="text-card-foreground font-serif">Open Orders</CardTitle>
              <CardDescription className="text-muted-foreground">
                Subaccount {selectedSubaccount.subaccountId}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {selectedSubaccount.orders.length > 0 ? (
                <OrdersTable orders={selectedSubaccount.orders} isLoading={false} />
              ) : (
                <EmptyState type="order" />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}