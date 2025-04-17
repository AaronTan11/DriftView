import { DriftDashboard } from "@/components/drift-dashboard"

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f5f3e6] text-[#5c4f3d]">
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8 text-[#5c4f3d] font-serif">Drift Protocol Dashboard</h1>
        <DriftDashboard />
      </div>
    </main>
  )
}
