import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { project_name, project_description, project_keywords } from "../config.js";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: project_name,
  description: project_description,
  keywords: project_keywords,
  icons: {
    icon: '/nobg.png',
    shortcut: '/nobg.png',
    apple: '/nobg.png',
  },
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
