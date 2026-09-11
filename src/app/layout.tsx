import type { Metadata } from "next";
import "./globals.css";
import { AdminShell } from "@/components/layout/AdminShell";
import { LanguageProvider } from "@/i18n/LanguageContext";

export const metadata: Metadata = {
  title: "WowCar Dealer Portal | Admin Portal",
  description: "Official administration portal for WowCar vehicle listings and dealer operations",
  keywords: "WowCar, dealer portal, car marketplace, vehicle management",
  icons: {
    icon: "/square3.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <LanguageProvider>
          <AdminShell>{children}</AdminShell>
        </LanguageProvider>
      </body>
    </html>
  );
}
