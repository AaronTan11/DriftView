export const mockBalances = [
  {
    token: "SOL",
    amount: "123.45",
    value: "$2,469.00"
  },
  {
    token: "USDC",
    amount: "5,000.00",
    value: "$5,000.00"
  },
  {
    token: "mSOL",
    amount: "50.25",
    value: "$1,055.25"
  }
]

export const mockPositions = [
  {
    market: "SOL-PERP",
    size: "+10.5",
    entryPrice: "$20.50",
    markPrice: "$21.25",
    pnl: "+$78.75",
    leverage: "2.5x",
    liquidationPrice: "$8.20"
  },
  {
    market: "BTC-PERP",
    size: "-0.15",
    entryPrice: "$42,500",
    markPrice: "$42,000",
    pnl: "+$75.00",
    leverage: "5x",
    liquidationPrice: "$45,600"
  }
]

export const mockOrders = [
  {
    market: "SOL-PERP",
    side: "BUY" as const,
    size: "15.5",
    price: "$20.25",
    type: "LIMIT",
    status: "OPEN",
    timeInForce: "GTC"
  },
  {
    market: "BTC-PERP",
    side: "SELL" as const,
    size: "0.25",
    price: "$43,500",
    type: "LIMIT",
    status: "OPEN",
    timeInForce: "GTC"
  }
]

export const mockSubaccounts = [
  {
    subaccountId: 0,
    name: "Main Account",
    active: true
  },
  {
    subaccountId: 1,
    name: "Trading Account",
    active: false
  },
  {
    subaccountId: 2,
    name: "HODL Account",
    active: false
  }
] 