
import {sites} from '@/_/lib/MeiliSearch';

//　テストに対応するため、Container/Presentational Components パターンにする

export async function Container ({id}:{id:string}) {
    const list = await sites();
    return <Presentaion list={list} id={id} />;
}

export const Presentaion = ({list, id}:{list:string[], id:string}) => {
    return (
        <datalist id={id}>
            {list.map((i) => <option key={i} value={i}>{i}</option>)}
        </datalist>
    );
}

export default Container