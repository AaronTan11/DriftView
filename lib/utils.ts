import { convertToNumber } from "@drift-labs/sdk";
import { SpotMarkets } from "@drift-labs/sdk";
import { BN } from "@drift-labs/sdk";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function convertRawAmountToReadable(
  amountBN: BN | string | undefined | null, 
  marketIndex: number,
  environment: 'mainnet-beta' | 'devnet' = 'mainnet-beta'
): number {
  if (!amountBN || amountBN === '0') {
    return 0;
  }

  try {
    const bn = typeof amountBN === 'string' ? new BN(amountBN) : amountBN;

    // Get market info for the specified index and environment
    const spotMarketInfo = SpotMarkets[environment]?.[marketIndex];
    if (!spotMarketInfo) {
      console.warn(`Market info not found for index: ${marketIndex} in environment: ${environment}`);
      return 0; // Cannot convert without market info
    }

    const precisionBN = spotMarketInfo.precision; 
    
    // Convert the raw BN amount to a readable number
    const readableAmount = convertToNumber(bn, precisionBN);
    
    return readableAmount;

  } catch (error) {
    console.error(`Error converting amount for market ${marketIndex}:`, error);
    return 0; // Return 0 if any error occurs during conversion
  }
}