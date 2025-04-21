import { WalletView } from './wallet-view'; 
import { WalletSearchInput } from './wallet-search-input';



export default function ViewWalletPage() {

  return (
    <main className="container mx-auto p-4 space-y-6">
      {/* Title or other static elements */}
      <h1 className="text-center text-2xl font-semibold text-foreground font-serif">
        View Wallet Data
      </h1>
      
      <div className="flex justify-center">
          <WalletSearchInput /> 
      </div>


      <WalletView /> 
    </main>
  );
}