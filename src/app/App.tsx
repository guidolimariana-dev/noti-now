import { tanStackRouterProvider } from 'ra-router-tanstack'
import { Admin, ListGuesser, ShowGuesser, LoginPage } from '@/components/admin'
import { Resource } from 'ra-core'
import { dataProvider } from '@/providers/d1DataProvider'
import { authProvider } from '@/providers/authProvider'

export function App() {
  return (
    //@ts-ignore
    <Admin routerProvider={tanStackRouterProvider} dataProvider={dataProvider} authProvider={authProvider} loginPage={LoginPage}>
    </Admin>
  );
}
