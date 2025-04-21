"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Search } from "lucide-react"
import { useWalletStore } from "@/stores/useWalletStore"

export function WalletSearchInput() {
  const [inputValue, setInputValue] = useState("")
  const setWalletAddress = useWalletStore(state => state.setWalletAddress)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmedAddress = inputValue.trim()
    if (trimmedAddress) {
      const newUrl = `/view/${trimmedAddress}`
      window.history.pushState(null, '', newUrl)
      setWalletAddress(trimmedAddress)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-md flex-col items-center gap-4 sm:flex-row"
    >
      <div className="grid w-full flex-1 items-center gap-1.5">
        <Label htmlFor="wallet-address" className="sr-only">
          Wallet Address
        </Label>
        <Input
          id="wallet-address"
          type="text"
          placeholder="Enter Solana wallet address..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          required
          className="bg-input text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
        />
      </div>
      <Button type="submit" className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90">
        <Search className="mr-2 h-4 w-4" /> View
      </Button>
    </form>
  )
}