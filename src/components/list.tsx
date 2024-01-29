
import React from 'react';
import Entry from '@/components/entry';

interface SearchResult {records: Array<{
    [key: string]: any;
  }>;
}
const List: React.FC<SearchResult> = ({ records}) => {
    return (
        <div className="flex flex-wrap -mx-4 -my-8 justify-center">
            {records.map(record => (
                <div className="p-4 md:py-8 w-full lg:max-w-sm">
                    <div className="h-full flex flex-col">
                        <Entry record={record} />
                    </div>
                </div>
            ))
            }
        </div>
    );
}
export default List;