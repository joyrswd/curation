
import {sites} from '@/_/lib/MeiliSearch';

async function Datalist ({id}:{id:string}) {
    const list = await sites();
    return (
        <datalist id={id}>
            {list.map((site:string, key:number) => (<option key={key} value={site}>{site}</option>))}
        </datalist>
    );
}

export default Datalist