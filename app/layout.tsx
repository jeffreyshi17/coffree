import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FreeCoffee - Capital One Coffee Redemption",
  description: "Automatically redeem Capital One free coffee offers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
