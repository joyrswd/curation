import 'tailwindcss/tailwind.css'
import Link from 'next/link'
import { Metadata } from 'next'

// either Static metadata
export const metadata: Metadata = {
  title: process.env.CURATION_APP_NAME,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        <main className="text-gray-600 body-font">
          <div className="container px-5 py-24 mx-auto">
            <div className="flex flex-wrap -mx-4 -my-8 justify-center">
              {children}
            </div>
          </div>
        </main>
        <footer className="text-gray-600 body-font fixed inset-x-0 bottom-0">
          <div className="container px-5 py-8 mx-auto flex items-center sm:flex-row flex-col">
            <Link className="flex title-font font-medium  text-xl items-center justify-center text-gray-900" href="/">
              {process.env.CURATION_APP_NAME}
            </Link>
          </div>
        </footer>
      </body>
    </html>
  )
}
