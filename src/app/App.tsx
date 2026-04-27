import { tanStackRouterProvider } from 'ra-router-tanstack'
import { Admin, ListGuesser, ShowGuesser, LoginPage } from '@/components/admin'
import { Resource } from 'ra-core'
import { dataProvider } from '@/providers/d1DataProvider'
import { authProvider } from '@/providers/authProvider'
import { RecorridoList, RecorridoCreate, RecorridoEdit, RecorridoShow } from './Recorrido'
import { RecordatorioList, RecordatorioCreate, RecordatorioEdit, RecordatorioShow } from './Recordatorio'

export function App() {
  return (
    //@ts-ignore
    <Admin routerProvider={tanStackRouterProvider} dataProvider={dataProvider} authProvider={authProvider} loginPage={LoginPage}>
      <Resource name="recorrido" list={RecorridoList} create={RecorridoCreate} edit={RecorridoEdit} show={RecorridoShow}/>
      <Resource name="recordatorio" list={RecordatorioList} create={RecordatorioCreate} edit={RecordatorioEdit} show={RecordatorioShow}/>
    </Admin>
  );
}
