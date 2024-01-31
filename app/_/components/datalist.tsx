
import MeiliSearch from '@/_/lib/MeiliSearch';

async function Datalist ({id}:{id:string}) {
    const sites = await MeiliSearch.sites();
    return (
        <datalist id={id}>
            {sites.map((site:string, key:number) => (<option key={key} value={site} />))}
        </datalist>
    );
}

export default Datalist