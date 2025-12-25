import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { project_name } from "../config.js";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${project_name} - Server Management`,
  description: "Perfect server management dashboard with real-time monitoring and managing capabilities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
