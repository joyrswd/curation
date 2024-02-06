import Link from 'next/link'
import SearchForm from '@/_/components/searchform'
import Datalist from '@/_/components/datalist'
import { Suspense } from 'react'

export default function Footer({title}: {title: string|undefined}) {
    return (
        <div>
            <div id="logo">
                <Link href="/">
                    {title}
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
    )
}
