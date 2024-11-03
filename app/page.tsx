// app/page.tsx
'use client'
import UploadImage from '@/components/UploadImage'
import Header from '@/components/Header'
// import SectionDivider from '@/components/SectionDivider'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center px-4">
      {/* <Hero /> */}
      {/* <SectionDivider /> */}
      {/* <Header /> */}
      <UploadImage/>
      {/* <SectionDivider /> */}
    </main>
  )
}