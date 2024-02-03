
import {sites} from '@/_/lib/MeiliSearch';

//　テストに対応するため、Container/Presentational Components パターンにする

export async function DatalistContainer ({id}:{id:string}) {
    const list = await sites();
    return <DatalistPresenter list={list} id={id} />;
}

export const DatalistPresenter = ({list, id}:{list:string[], id:string}) => {
    return (
        <datalist id={id}>
            {list.map((i) => <option key={i} value={i}>{i}</option>)}
        </datalist>
    );
}

export default DatalistContainer