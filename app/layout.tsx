import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: {
    default: 'Sipandu — Sistem Pendataan Kependudukan Kelurahan',
    template: '%s | Sipandu',
  },
  description:
    'Sistem Pendataan dan Pelaporan Kependudukan Kelurahan Setiamulya. Platform digital untuk pendataan warga, laporan kependudukan, dan analitik wilayah.',
  keywords: ['kependudukan', 'kelurahan', 'pendataan', 'laporan', 'warga'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}

