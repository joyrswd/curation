import 'tailwindcss/tailwind.css'
import './global.css'
import Link from 'next/link'
import { Metadata } from 'next'
import SearchForm from '@/_/components/searchform'
import Datalist from '@/_/components/datalist'
import { Suspense } from 'react'
import { GoogleTagManager } from '@next/third-parties/google'
import {AppConf} from '@/_/conf/app';

// either Static metadata
export const metadata: Metadata = {
  title: AppConf.appName,
  description: AppConf.meta.description,
  keywords: AppConf.meta.keywords,
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
                  {AppConf.appName}
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
      {AppConf.gtmId && (<GoogleTagManager gtmId={AppConf.gtmId} />)}
    </html>
  )
}
