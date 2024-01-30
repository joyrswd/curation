
import MeiliSearch from '@/_/lib/MeiliSearch';

export default async ({id}:{id:string}) => {
    const sites = await MeiliSearch.sites();
    return (
        <datalist id={id}>
            {sites.map((site:string, key:number) => (<option key={key} value={site} />))}
        </datalist>
    );
}
