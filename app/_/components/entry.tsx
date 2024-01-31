import React from 'react';
import Link from 'next/link'

interface EntryProps {
    record: {
        [key: string]: any;
    };
}

const Entry: React.FC<EntryProps> = ({ record }) => {
    const month = new Date(record.date).toLocaleString('en-us', { month: 'short' });
    const day = new Date(record.date).toLocaleString('en-us', { day: '2-digit' });
    const time = new Date(record.date).toLocaleString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    const date = new Date(record.date).toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
    return (
        <div className="p-4 md:py-8 w-full lg:max-w-sm">
            <div className="h-full flex flex-col">
                <div className="leading-none flex">
                    <p className="w-12 text-center self-center mr-3">
                        {record.image && <img alt="blog" src={record.image} className="w-7 h-7 m-auto md:w-10 md:h-10 mb-1 rounded-full flex-shrink-0 object-cover object-center" />}
                        <span className="text-gray-500 text-sm">{time}</span>
                    </p>
                    <a href={record.link} target="feed" className='w-full'><h1 className="title-font self-center text-l md:text-xl font-medium text-gray-900">{record.title}</h1></a>
                </div>
                <div className="m-3 grow hidden md:block">
                    <p className="leading-relaxed"><a href={record.link} target="feed">{record.intro.substring(0, 200)}</a></p>
                </div>
                <div className="self-end w-full flex md:items-end">
                    <div className='w-12 mr-3 text-center text-sm'>
                        <Link href={{ pathname: '/find', query: { date: date } }} className='flex md:flex-col'>
                            <span className="text-gray-500 md:pb-2 md:mb-2 md:border-b-2 border-gray-200">{month}</span>
                            <span className="font-medium title-font ml-1 md:ml-0 md:text-gray-800 md:text-lg md:leading-none">{day}</span>
                        </Link>
                    </div>
                    <div className="w-full text-end text-sm">
                        <p className='float-left md:float-none'><Link href={{ pathname: '/find', query: { category: record.category } }}>{record.category}</Link></p>
                        <p><Link className="title-font md:font-medium text-gray-500" href={{ pathname: '/find', query: { site: record.site } }}>{record.site}</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Entry;