'use server';
import React from 'react';
import Link from 'next/link'
import Image from 'next/image'
import MeiliSearch from '@/_/lib/MeiliSearch';

const Entry = async ({ id }: { id: string }) => {
    const record = await MeiliSearch.get(id);
    if (!record) return null;
    const month = new Date(record.date).toLocaleString('en-us', { month: 'short' });
    const day = new Date(record.date).toLocaleString('en-us', { day: '2-digit' });
    const time = new Date(record.date).toLocaleString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    const date = new Date(record.date).toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
    return (
        <div className="w-full lg:max-w-sm mx-1 mb-2">
            <div className="h-full flex flex-col p-4 md:pb-9 bg-gradient-to-t from-white via-neutral-200/75 via-10% to-white to-50%">
                <div className="flex">
                    <p className="w-12 text-center self-center mr-3 leading-none">
                        {record.image && <Image alt="blog" src={record.image} width={100} height={100} className="w-7 h-7 m-auto md:w-10 md:h-10 rounded-full flex-shrink-0 object-cover object-center" />}
                        <span className="text-gray-500 text-xs">{time}</span>
                    </p>
                    <a href={record.link} target="feed" className='w-full flex'><h1 className="self-center w-full pb-2.5 title-font font-medium text-gray-700 text-sm md:text-lg">{record.title}</h1></a>
                </div>
                <div className="m-2 pb-4 grow hidden md:block">
                    <p className="leading-relaxed text-sm"><a href={record.link} target="feed">{record.intro.substring(0, 200)}</a></p>
                </div>
                <div className="self-end w-full flex md:items-end text-xs mt-1">
                    <div className='w-12 mr-3 text-center'>
                        <a href={'/find?date=' + date} className='flex md:flex-col'>
                            <span className="text-gray-500 md:pb-2 md:mb-2 md:border-b-2 border-gray-400/50">{month}</span>
                            <span className="font-medium title-font ml-1 md:ml-0 md:text-gray-800 md:text-lg md:leading-none">{day}</span>
                        </a>
                    </div>
                    <div className="w-full text-end">
                        {record.category && <p className='mr-2 md:mr-0 float-left md:float-none'><a href={'/find?category=' + record.category}>{record.category}</a></p>}
                        <p className='text-ellipsis overflow-hidden text-nowrap'><a className="title-font md:font-medium text-gray-500" href={'/find?site=' + record.site}>{record.site}</a></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Entry;