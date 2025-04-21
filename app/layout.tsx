import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Wallet } from "@/lib/integration/wallet";
import Providers from "./providers";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner"


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DriftView",
  description: "DriftView is a tool for viewing and analyzing Drift data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >

          <SidebarProvider>
            <AppSidebar className="bg-ghibli-sidebar text-ghibli-sidebar-foreground border-ghibli-border" />
            <SidebarInset className="min-h-screen">
              <header className="top-0 z-10 flex h-16 items-center gap-4 border-b bg-ghibli-background py-10 px-4 sm:px-6">
                <SidebarTrigger className="text-ghibli-foreground hover:text-ghibli-accent-foreground" />
                <Breadcrumb className="hidden md:flex">
                  <BreadcrumbList className="text-ghibli-muted-foreground">
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/" className="hover:text-ghibli-foreground">
                        Dashboard
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="text-ghibli-muted-foreground" />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="text-ghibli-foreground">Home</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </header>
              <Separator className="border-ghibli-border" />
              <Providers>
                <Wallet>{children}</Wallet>
              </Providers>
            </SidebarInset>
          </SidebarProvider>
          <Toaster />
      </body>
    </html>
  );
}
