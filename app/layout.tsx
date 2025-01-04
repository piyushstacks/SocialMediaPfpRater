// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// Components
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ThemeProvider from '@/context/theme-context'

// Initialize font with preload
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'XIG PFP Rater',
    template: '%s | XIG PFP Rater'
  },
  description: 'Upload and rate images easily',
  keywords: ['image rating', 'photo sharing', 'web app'],
  authors: [{ name: 'Your Name' }],
  metadataBase: new URL('https://your-domain.com'),
  openGraph: {
    title: 'XIG PFP Rater',
    description: 'Upload and rate images easily',
    url: 'https://your-domain.com',
    siteName: 'XIG PFP Rater',
    locale: 'en_US',
    type: 'website',
  },
}

interface RootLayoutProps {
  children: React.ReactNode
}
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html 
      lang="en" 
      className={`!scroll-smooth ${inter.variable}`} 
      suppressHydrationWarning
    >
      <body 
        className={`${inter.className} relative
          bg-gray-100 text-gray-900
          dark:bg-gray-950 dark:text-gray-100
          transition-colors duration-300 ease-in-out`}
      >
        {/* Updated Background Gradients */}
        <div 
          className="absolute top-[-10rem] -z-10 right-[5rem] 
            h-[35rem] w-[35rem] rounded-full blur-[12rem] opacity-70
            sm:w-[70rem]
            bg-gradient-to-br from-[#ffd8b2] via-[#b2ceffa2] to-[#ffc5b2] 
            dark:from-[#5b4b8a] dark:via-[#453774] dark:to-[#302252]
            transition-colors duration-500 ease-in-out"
        />
        <div 
          className="absolute top-[2rem] -z-10 left-[-40rem] 
            h-[40rem] w-[55rem] rounded-full blur-[12rem] opacity-60
            sm:w-[75rem] md:left-[-37rem] lg:left-[-30rem] xl:left-[-20rem] 2xl:left-[-10rem]
            bg-gradient-to-tr from-[#ffede1] via-[#d5f3ff] to-[#b2cfff]
            dark:from-[#4a3f67] dark:via-[#3a2e55] dark:to-[#261d3c]
            transition-colors duration-500 ease-in-out"
        />


      
<ThemeProvider>
  <div className="flex min-h-screen flex-col">
    <Header />
    <main className="flex-grow flex flex-col items-center justify-center">
      {children}
    </main>
    <Footer />
  </div>
</ThemeProvider>

      </body>
    </html>
  )
}
