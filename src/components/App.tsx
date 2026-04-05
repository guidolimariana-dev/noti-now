import { tanStackRouterProvider } from "ra-router-tanstack";
import { Admin } from "@/components/admin";

export function App() {
  return <Admin routerProvider={tanStackRouterProvider}></Admin>;
}
