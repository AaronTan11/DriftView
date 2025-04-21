# 🚀 Drift View: Your Slick Dashboard for Drift Protocol Perps! 😎

Tired of juggling browser tabs and complex interfaces to manage your Drift perp positions? Wish you had a clean, simple view of your trades? **Well, buckle up, buttercup, because Drift View is here to save the day!** 🎉

## 🤔 So, What IS This Magical Thing?

Drift View is your personal command center for the [Drift Protocol](https://www.drift.trade/) on Solana. Think of it as a sleek, intuitive dashboard that pulls in your perpetual positions and TP/SL orders, letting you manage them without pulling your hair out. It's built with [Next.js](https://nextjs.org) and talks directly to the Drift SDK, giving you a real-time view of your trading action.

## ✨ Features That'll Make You Go "Whoa!" ✨

*   **👀 See Everything at a Glance:** View all your open perpetual positions in one neat table. Market, side, size, entry price, PnL (with pretty colors!), liquidation price – it's all there!
*   **🛡️ Manage Your TP/SL Orders:** Got Take Profit or Stop Loss orders set up? We'll show 'em to you, clear as day, in their own dedicated table.
*   **⚡ Quick Actions:**
    *   **Close Positions:** Made enough profit? Or cutting losses? Close positions with a single click directly from the positions table (we even show a cool loading spinner!).
    *   **Cancel Orders:** Changed your mind about that TP/SL? Zap it away instantly from the orders table.
*   **➕ Place New Orders:** Jump into the action or adjust your strategy using the integrated order placement dialog. *(This feature is available via the "Place Order" button)*
*   **🔗 Explorer Links:** Easily verify your close/cancel transactions on the Solana explorer. Transparency rocks!
*   **🎨 Smooth & Clean UI:** Built with modern tools like [Shadcn UI](https://ui.shadcn.com/) and [Tailwind CSS](https://tailwindcss.com/) for a pleasant viewing experience. No more eye strain!
*   **🔄 Real-time(ish) Updates:** Uses [TanStack Query](https://tanstack.com/query/latest) to keep your data fresh after actions.


## 🛠️ Tech Stack

This project is lovingly crafted with:

*   [Next.js](https://nextjs.org) (App Router)
*   [TypeScript](https://www.typescriptlang.org/)
*   [Drift Protocol SDK V2](https://github.com/drift-labs/protocol-v2)
*   [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/) & Wallet Adapter
*   [Zustand](https://zustand-demo.pmnd.rs/) (for state management)
*   [TanStack Query](https://tanstack.com/query/latest) (for data fetching/caching)
*   [Shadcn UI](https://ui.shadcn.com/) & [Tailwind CSS](https://tailwindcss.com/) (for the pretty looks)
*   [Lucide React](https://lucide.dev/) (for icons)
*   [Sonner](https://sonner.emilkowal.ski/) (for slick notifications)

## 🚀 Getting Started (The Boring But Necessary Part)

Okay, enough fun. Here's how to get this running locally:

First, clone the repo (if you haven't already) and install dependencies:

```bash
# If you haven't cloned:
# git clone <your-repo-url>
# cd drift-view # or your project directory name
pnpm install
```

Then, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser. You'll need a Solana wallet (like Phantom, Solflare, etc.) connected to **Mainnet-Beta** with some funds and activity on Drift Protocol to see your positions and orders.

## ⚠️ Important Disclaimer ⚠️

This is a tool built for interacting with DeFi protocols, which is Drift Protocol. Trading perpetual futures is **highly risky** and can lead to significant losses, including liquidation. This project is not affiliated with Drift Protocol. It's just a personal project, that can be well running in production, but won't be responsible for any losses incurred while using this application.

---

*Now go forth and manage those perps like a boss!* 💪

*Or go stalk other people's perp positions and TP/SL orders!* 👀 😂
