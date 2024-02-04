export type Pagination = {
    result: boolean;
    ids: string[];
    current: number;
    previous: number;
    next: number;
    last: number;
};

export type Document = {
    id: string;
    title: string;
    link: string;
    date: string;
    intro: string;
    image: string;
    category: string;
    site: string;
    home: string;
    timestamp: number;
};
