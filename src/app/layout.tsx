import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AmbientBackground from "@/components/cybercert/AmbientBackground";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CyberCert | ROOT SEC ACADEMY",
  description: "Plataforma de Simulação e Treinamento de Certificações em Cibersegurança",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#030407] text-zinc-100 selection:bg-sky-500/20 selection:text-sky-200 relative antialiased">
        <AmbientBackground />
        {children}
      </body>
    </html>
  );
}
