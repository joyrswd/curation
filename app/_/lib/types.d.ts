export type Pagination = {
    result: boolean;
    ids: number[];
    current: number;
    previous: number;
    next: number;
    last: number;
};

export type Document = {
    id: number;
    title: string;
    link: string;
    date: string;
    intro: string;
    image: string;
    category: string;
    site: string;
    timestamp: number;
};

export type SearchKeys = {
    site: string;
    date: string;
    category: string;
};

export type SiteType = {
    id: number;
    url: string;
    frequency: number;
    lastupdate: number;
}
