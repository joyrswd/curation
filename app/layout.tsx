import 'tailwindcss/tailwind.css'
import './global.css'
import { Metadata } from 'next'
import { GoogleTagManager } from '@next/third-parties/google'
import {AppConf} from '@/_/conf/app';
import Footer from '@/_/components/footer'

// either Static metadata
export const metadata: Metadata = {
  title: AppConf.appName,
  description: AppConf.meta.description,
  keywords: AppConf.meta.keywords,
}

export default function Layout({
  main,
  top,
  baseline,
  bottom,
}: {
  main: React.ReactNode
  top: React.ReactNode
  baseline: React.ReactNode
  bottom: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        <div id="wrapper" className="text-gray-600 body-font">
          {top}
          <main className="container px-5 py-12 mx-auto">
            <div className="flex flex-wrap -mx-4 -my-8 justify-center">
                {main}
            </div>
          </main>
          {baseline}
          <footer>
            <Footer title={AppConf.appName} />
          </footer>
          {bottom}
        </div>
      </body>
      {AppConf.gtmId && (<GoogleTagManager gtmId={AppConf.gtmId} />)}
    </html>
  )
}
