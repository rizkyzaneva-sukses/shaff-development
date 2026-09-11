import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Shaff Development — Workspace",
  description: "Ruang kerja internal untuk pendampingan dan digitalisasi bisnis client.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>
}
