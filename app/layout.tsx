import type { Metadata } from "next";
import "./globals.css";
import Providers from "../components/SessionProvider";

export const metadata: Metadata = {
  title: "Salary Management App",
  description: "Admin dashboard for salary management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: '#f5f5f5' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
