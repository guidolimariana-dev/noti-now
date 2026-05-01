import { useGetList, useTranslate } from 'ra-core';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loading } from '@/components/admin';
import { Calendar, Phone, Mail, MessageSquare } from 'lucide-react';

export const Dashboard = () => {
  const translate = useTranslate();
  
  // Fetch recordatorios programados
  const { data: recordatorios, total: totalRecordatorios, isLoading: loadingRecordatorios } = useGetList(
    'recordatorio',
    {
      pagination: { page: 1, perPage: 10 },
      sort: { field: 'envio_mensaje', order: 'ASC' },
      filter: { estado: 'Programado' },
    }
  );

  // Fetch clients without phone
  const { data: sinTelefono, total: totalSinTelefono, isLoading: loadingSinTelefono } = useGetList(
    'clientes',
    {
      pagination: { page: 1, perPage: 10 },
      filter: { telefono: '' },
    }
  );

  // Fetch clients without email
  const { data: sinMail, total: totalSinMail, isLoading: loadingSinMail } = useGetList(
    'clientes',
    {
      pagination: { page: 1, perPage: 10 },
      filter: { email: '' },
    }
  );

  // Fetch clients without communication (llamar_sn === 'N')
  const { data: sinComu, total: totalSinComu, isLoading: loadingSinComu } = useGetList(
    'clientes',
    {
      pagination: { page: 1, perPage: 10 },
      filter: { llamar_sn: 'N' },
    }
  );

  if (loadingRecordatorios || loadingSinTelefono || loadingSinMail || loadingSinComu) {
    return <Loading />;
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight font-serif">Inicio</h1>
        <p className="text-muted-foreground italic">
          Bienvenido. Aquí tienes un resumen del estado de los recordatorios y clientes.
        </p>
      </div>

      {/* Grid Layout: Recordatorios a la Izquierda, Clientes a la Derecha */}
      <div className="grid gap-8 lg:grid-cols-2">
        
        {/* LADO IZQUIERDO: Recordatorios */}
        <div className="space-y-4">
          <Card className="shadow-md border-primary/10 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Recordatorios Programados
                </CardTitle>
                <CardDescription>
                  Próximos envíos pendientes
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="rounded-md border overflow-hidden bg-background">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[100px]">ID</TableHead>
                      <TableHead>Fecha de Envío</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recordatorios?.map((r) => (
                      <TableRow key={r.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-mono font-medium">#{r.id}</TableCell>
                        <TableCell>{new Date(r.envio_mensaje).toLocaleString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</TableCell>
                      </TableRow>
                    ))}
                    {recordatorios?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="h-24 text-center text-muted-foreground italic">
                          No hay recordatorios programados.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* LADO DERECHO: Atención de Clientes */}
        <div className="space-y-4">
          <div className="flex flex-col gap-1 pb-2">
            <h2 className="text-xl font-semibold tracking-tight">Atención de Clientes</h2>
            <p className="text-sm text-muted-foreground">Clientes con datos faltantes o sin comunicación</p>
          </div>
          
          <Accordion type="multiple" className="w-full space-y-4">
            <AccordionItem value="sin-telefono" className="border rounded-xl px-6 bg-card shadow-sm hover:shadow-md transition-shadow duration-200">
              <AccordionTrigger className="hover:no-underline py-5 group text-left">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-amber-100 text-amber-600 rounded-lg group-hover:bg-amber-200 transition-colors">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-lg block">Clientes sin Teléfono</span>
                    <span className="text-sm text-muted-foreground font-normal">Total: {totalSinTelefono}</span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <ClientTable data={sinTelefono} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sin-mail" className="border rounded-xl px-6 bg-card shadow-sm hover:shadow-md transition-shadow duration-200">
              <AccordionTrigger className="hover:no-underline py-5 group text-left">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-lg block">Clientes sin Mail</span>
                    <span className="text-sm text-muted-foreground font-normal">Total: {totalSinMail}</span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <ClientTable data={sinMail} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sin-comunicacion" className="border rounded-xl px-6 bg-card shadow-sm hover:shadow-md transition-shadow duration-200">
              <AccordionTrigger className="hover:no-underline py-5 group text-left">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-rose-100 text-rose-600 rounded-lg group-hover:bg-rose-200 transition-colors">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-lg block">Clientes sin Comunicación</span>
                    <span className="text-sm text-muted-foreground font-normal">Total: {totalSinComu}</span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <ClientTable data={sinComu} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

      </div>
    </div>
  );
};

const ClientTable = ({ data }: { data: any[] | undefined }) => (
  <div className="rounded-lg border overflow-hidden mt-2 bg-background">
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/30">
          <TableHead className="w-[100px] font-bold">Código</TableHead>
          <TableHead className="font-bold">Razón Social</TableHead>
          <TableHead className="font-bold">Fantasía</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data?.map((c) => (
          <TableRow key={c.id} className="hover:bg-muted/20">
            <TableCell className="font-medium">{c.codigo}</TableCell>
            <TableCell className="max-w-[150px] truncate" title={c.razon_social}>{c.razon_social}</TableCell>
            <TableCell className="max-w-[150px] truncate" title={c.nombre_fantasia}>{c.nombre_fantasia}</TableCell>
          </TableRow>
        ))}
        {data?.length === 0 && (
          <TableRow>
            <TableCell colSpan={3} className="h-24 text-center text-muted-foreground italic">
              Sin registros.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </div>
);
