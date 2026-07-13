import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sankofa Express | Logistics Platform",
  description: "Courier management platform for Ghana — tracking, dispatch, and settlement.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
