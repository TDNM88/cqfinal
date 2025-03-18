import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CaslaQuartz AI',
  description: 'Developed by TDNM',
  generator: 'Flux',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
