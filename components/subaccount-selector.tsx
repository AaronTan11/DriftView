"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Loader2 } from "lucide-react"

interface Subaccount {
  subaccountId: number
  name: string
  active: boolean
}

interface SubaccountSelectorProps {
  subaccounts: Subaccount[]
  selectedSubaccountId: number
  onSelectSubaccount: (subaccountId: number) => void
  isLoading?: boolean
}

export function SubaccountSelector({ 
  subaccounts, 
  selectedSubaccountId, 
  onSelectSubaccount,
  isLoading = false
}: SubaccountSelectorProps) {
  return (
    <div className="flex items-center gap-2 bg-[#d8e2dc] p-2 rounded-lg border border-[#a7c4bc] shadow-md">
      <span className="text-sm font-medium text-[#5c4f3d]">Subaccount:</span>
      {isLoading ? (
        <div className="flex items-center">
          <Loader2 className="h-4 w-4 text-[#6a994e] animate-spin mr-2" />
          <span className="text-sm text-[#5c4f3d]">Loading...</span>
        </div>
      ) : (
        <Select
          value={selectedSubaccountId.toString()}
          onValueChange={(value) => onSelectSubaccount(Number.parseInt(value))}
        >
          <SelectTrigger className="w-[180px] bg-[#f8f9fa] border-[#a7c4bc] text-[#5c4f3d]">
            <SelectValue placeholder="Select subaccount" />
          </SelectTrigger>
          <SelectContent className="bg-[#f8f9fa] border-[#a7c4bc]">
            {subaccounts.map((subaccount) => (
              <SelectItem key={subaccount.subaccountId} value={subaccount.subaccountId.toString()} className="text-[#5c4f3d]">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`h-6 w-6 rounded-full p-0 flex items-center justify-center ${
                      subaccount.active ? 'bg-[#6a994e] border-[#6a994e]' : 'bg-[#a7c4bc] border-[#6a994e]'
                    }`}
                  >
                    <Sparkles className={`h-3 w-3 ${subaccount.active ? 'text-white' : 'text-[#5c4f3d]'}`} />
                  </Badge>
                  <span>{subaccount.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
