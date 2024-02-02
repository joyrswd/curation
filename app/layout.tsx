import 'tailwindcss/tailwind.css'
import './global.css'
import Link from 'next/link'
import { Metadata } from 'next'
import SearchForm from '@/_/components/searchform'
import Datalist from '@/_/components/datalist'
import { Suspense } from 'react'
import { GoogleTagManager } from '@next/third-parties/google'

// either Static metadata
export const metadata: Metadata = {
  title: process.env.CURATION_APP_NAME,
  description: process.env.CURATION_APP_ABOUT,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        <div id="wrapper" className="text-gray-600 body-font">
          <main className="container px-5 py-12 mx-auto">
            <div className="flex flex-wrap -mx-4 -my-8 justify-center">
                {children}
            </div>
          </main>
          <footer>
            <div>
              <div id="logo">
                <Link href="/">
                  {process.env.CURATION_APP_NAME}
                </Link>
              </div>
              <div>
                <label><input type="checkbox" id="toggle" defaultChecked /></label>
              </div>
              <div>
                <Suspense>
                  <SearchForm />
                  <Datalist id="site-name" />
                </Suspense>
              </div>
            </div>
          </footer>
        </div>
      </body>
      {process.env.CURATION_APP_GTM_ID && (<GoogleTagManager gtmId={process.env.CURATION_APP_GTM_ID} />)}
    </html>
  )
}
