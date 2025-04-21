import { create } from "zustand"

interface WalletStore {
  walletAddress: string
  setWalletAddress: (address: string) => void
}

export const useWalletStore = create<WalletStore>((set) => ({
  walletAddress: "",
  setWalletAddress: (address) => set({ walletAddress: address }),
})) 