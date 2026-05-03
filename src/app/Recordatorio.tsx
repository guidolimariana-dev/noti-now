import { 
  List, 
  DataTable,
  EditButton,
  ShowButton,
  Create,
  Edit,
  Show,
  SimpleForm,
  SelectInput,
  TextInput,
  DateTimeInput,
  TextField,
  DateField,
  ReferenceField,
  ReferenceInput,
  CreateButton,
  RecordField,
  Loading,
} from '@/components/admin'
import { 
  useRecordContext,
  useUpdate,
  useNotify,
  useRedirect,
  useGetList,
  useGetOne,
} from 'ra-core'
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { MessageSquare } from 'lucide-react';

const DEFAULT_MENSAJE_TEMPLATE = "Saludos (Sr./Sra./Sres.), (---). Este mensaje es para comentarles que estamos organizando nuestro próximo recorrido, entrega de mercadería para vuestra zona. La entrega será aproximadamente a partir del (L/M/M/J/V/S) (dd/mm/aaaa). Solicitamos si es de vuestro interés, hacer su pedido hasta el (dd/mm/aaaa) a las (hh:mm). Que disfrute de su día. Equipo de Comunicación GF.";

const getDayAbbreviation = (date: Date) => {
  const days = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  return days[date.getDay()];
};

const formatMensaje = (template: string, entregaDate: Date | null, limiteDate: Date | null) => {
  let result = template;
  
  if (entregaDate && !isNaN(entregaDate.getTime())) {
    const dayName = getDayAbbreviation(entregaDate);
    const dateStr = format(entregaDate, 'dd/MM/yyyy');
    result = result.replace('(L/M/M/J/V/S)', dayName);
    result = result.replace('(dd/mm/aaaa)', dateStr);
  }

  if (limiteDate && !isNaN(limiteDate.getTime())) {
    const dateStr = format(limiteDate, 'dd/MM/yyyy');
    const timeStr = format(limiteDate, 'HH:mm');
    // Note: Use a more specific replacement if the same placeholder exists multiple times
    result = result.replace('(dd/mm/aaaa)', dateStr);
    result = result.replace('(hh:mm)', timeStr);
  }

  return result;
};

const MensajeAutoFiller = () => {
  const { watch, setValue } = useFormContext();
  const entregaTentativa = watch('entrega_tentativa');
  const fechaRecepcionPedido = watch('fecha_recepcion_pedido');
  const currentMensaje = watch('mensaje');

  useEffect(() => {
    if (!currentMensaje || currentMensaje.includes('(dd/mm/aaaa)') || currentMensaje === DEFAULT_MENSAJE_TEMPLATE) {
      const entrega = entregaTentativa ? new Date(entregaTentativa) : null;
      const limite = fechaRecepcionPedido ? new Date(fechaRecepcionPedido) : null;
      
      const newMensaje = formatMensaje(DEFAULT_MENSAJE_TEMPLATE, entrega, limite);
      if (newMensaje !== currentMensaje) {
        setValue('mensaje', newMensaje);
      }
    }
  }, [entregaTentativa, fechaRecepcionPedido, setValue, currentMensaje]);

  return null;
};

const validateRecordatorio = (values: any) => {
  const errors: any = {};
  const now = new Date();
  
  if (!values.envio_mensaje) {
    errors.envio_mensaje = 'Campo faltante. Es necesario que complete el campo \'Envío Mensaje\' para guardar los cambios.';
  } else {
    const envio = new Date(values.envio_mensaje);
    if (!isNaN(envio.getTime()) && envio < new Date(now.setSeconds(0, 0))) {
      errors.envio_mensaje = 'La fecha de envío no puede ser anterior a la fecha actual.';
    }
  }

  if (!values.fecha_recepcion_pedido) {
    errors.fecha_recepcion_pedido = 'Campo faltante. Es necesario que complete el campo \'Fecha Recepción Pedido\' para guardar los cambios.';
  } else if (values.envio_mensaje) {
    const envio = new Date(values.envio_mensaje);
    const limite = new Date(values.fecha_recepcion_pedido);
    if (!isNaN(envio.getTime()) && !isNaN(limite.getTime()) && limite <= envio) {
      errors.fecha_recepcion_pedido = 'La fecha de recepción pedido debe ser posterior a la fecha de envío mensaje.';
    }
  }

  if (!values.entrega_tentativa) {
    errors.entrega_tentativa = 'Campo faltante. Es necesario que complete el campo \'Entrega Tentativa\' para guardar los cambios.';
  } else if (values.fecha_recepcion_pedido) {
    const limite = new Date(values.fecha_recepcion_pedido);
    const entrega = new Date(values.entrega_tentativa);
    if (!isNaN(limite.getTime()) && !isNaN(entrega.getTime()) && entrega <= limite) {
      errors.entrega_tentativa = 'La entrega tentativa debe ser posterior a la fecha de recepción pedido.';
    }
  }

  if (!values.id_recorrido) {
    errors.id_recorrido = 'Campo faltante. Es necesario que complete el campo \'Recorrido\' para guardar los cambios.';
  }

  if (!values.mensaje) {
    errors.mensaje = 'Campo faltante. Es necesario que complete el campo \'Mensaje\' para guardar los cambios.';
  }

  return errors;
};

const RecordatorioActions = () => {
  const record = useRecordContext();
  const [update, { isLoading }] = useUpdate();
  const notify = useNotify();
  const redirect = useRedirect();

  if (!record) return null;

  const handleCancel = () => {
    update(
      'recordatorio', 
      { id: record.id, data: { ...record, estado: 'Cancelado' } },
      { 
        mutationMode: 'pessimistic',
        onSuccess: () => {
          notify('Recordatorio cancelado');
          redirect('list', 'recordatorio');
        }
      }
    );
  };

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="destructive" 
        size="sm"
        onClick={(e) => {
            e.stopPropagation();
            handleCancel();
        }} 
        disabled={record.estado !== 'Programado' || isLoading}
      >
        Cancelar
      </Button>
      <EditButton />
    </div>
  );
};

export const RecordatorioList = () => (
  <List
    title="Recordatorios"
    sort={{ field: 'id', order: 'DESC' }}
    filters={[
      <TextInput 
        source="q" 
        label="Buscar" 
        placeholder="Buscar por envío mensaje..." 
        alwaysOn 
        className="w-72"
      />,
      <SelectInput
        source="estado"
        label="Estado"
        choices={[
          { id: 'Programado', name: 'Programado' },
          { id: 'Enviado', name: 'Enviado' },
          { id: 'Cancelado', name: 'Cancelado' },
        ]}
        emptyText="Filtrar por estado..."
        alwaysOn
        className="w-48"
      />,
      <ReferenceInput 
        source="id_recorrido" 
        reference="recorrido"
        perPage={100}
        alwaysOn
      >
        <SelectInput 
          label="Recorrido" 
          optionText="nombre" 
          optionValue="codigo"
          emptyText="Filtrar por recorrido..."
          className="w-64"
        />
      </ReferenceInput>
    ]}
    actions={
      <div className="flex items-center gap-2">
        <CreateButton />
      </div>
    }
  >
    <DataTable
      bulkActionButtons={false}
      rowClick="show"
    >
      <DataTable.Col 
        source="id" 
        label="ID" 
        conditionalClassName={(record) =>
          !record || !record.estado
            ? 'border-l-4 border-gray-300'
            : record.estado === 'Cancelado'
            ? 'border-l-4 border-red-500'
            : record.estado === 'Enviado'
            ? 'border-l-4 border-green-500'
            : 'border-l-4 border-yellow-500' // Programado
        }
      />
      <DataTable.Col source="envio_mensaje" label="Envío Mensaje">
         <DateField source="envio_mensaje" showTime />
      </DataTable.Col>
      <DataTable.Col source="fecha_recepcion_pedido" label="Fecha Recepción Pedido" disableSort={true}>
         <DateField source="fecha_recepcion_pedido" showTime />
      </DataTable.Col>
      <DataTable.Col source="entrega_tentativa" label="Entrega Tentativa" disableSort={true}>
         <DateField source="entrega_tentativa" showTime />
      </DataTable.Col>
      <DataTable.Col source="estado" label="Estado" disableSort={true} />
      <DataTable.Col source="id_recorrido" label="Recorrido" disableSort={true}>
        <ReferenceField source="id_recorrido" reference="recorrido" target="codigo" link={false}>
           <TextField source="nombre" />
        </ReferenceField>
      </DataTable.Col>
    </DataTable>
    <p className="text-xs text-muted-foreground mt-4 italic">
        *Para ordenar los recorridos de la tabla por su envío mensaje, hacer click sobre el nombre de la columna para ordenar alfabeticamente y tocar el simbolo con la flecha para ordenar a la inversa. Igualmente con la columna de los identificadores.
    </p>
  </List>
);

const RecordatorioShowLayout = () => {
  const recordContext = useRecordContext();
  
  // Forzar la carga completa del recordatorio para asegurar que tenemos el campo 'mensaje'
  const { data: record, isLoading: isLoadingRecord } = useGetOne(
    'recordatorio',
    { id: recordContext?.id },
    { enabled: !!recordContext?.id }
  );
  
  const { data: recorrido } = useGetOne(
    'recorrido', 
    { id: record?.id_recorrido }, 
    { enabled: !!record?.id_recorrido }
  );

  const { data: clientes, isLoading: isLoadingClientes } = useGetList(
    'clientes',
    {
      filter: { numero_circuito: record?.id_recorrido },
      pagination: { page: 1, perPage: 1000 },
      sort: { field: 'codigo', order: 'ASC' }
    },
    { enabled: !!record?.id_recorrido }
  );

  if (isLoadingRecord || !record || !recorrido) return <Loading />;
  if (isLoadingClientes) return <Loading />;

  const clientesAContactar = clientes?.filter(c => 
    c.llamar_sn === 'S' && 
    c.forma_contacto && 
    c.forma_contacto.trim() !== '' &&
    (c.forma_contacto.toLowerCase() === 'whatsapp' ? (c.telefono && c.telefono.trim() !== '') : true) &&
    (c.forma_contacto.toLowerCase() === 'mail' ? (c.email && c.email.trim() !== '') : true)
  ) || [];

  const clientesSinComunicacion = clientes?.filter(c => c.llamar_sn === 'N') || [];
  const clientesSinTelefono = clientes?.filter(c => !c.telefono || c.telefono.trim() === '') || [];
  const clientesSinMail = clientes?.filter(c => !c.email || c.email.trim() === '') || [];

  return (
    <div className="space-y-6">
      {/* Encabezado compacto */}
      <Card className="bg-muted/20 border-none shadow-none">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-x-8 gap-y-4">
            <RecordField source="envio_mensaje" label="ENVÍO MENSAJE" className="min-w-[150px]">
              <DateField source="envio_mensaje" showTime className="text-sm font-bold" />
            </RecordField>
            <RecordField source="fecha_recepcion_pedido" label="FECHA RECEPCIÓN PEDIDO" className="min-w-[150px]">
              <DateField source="fecha_recepcion_pedido" showTime className="text-sm font-bold" />
            </RecordField>
            <RecordField source="entrega_tentativa" label="ENTREGA TENTATIVA" className="min-w-[150px]">
              <DateField source="entrega_tentativa" showTime className="text-sm font-bold" />
            </RecordField>
            <RecordField source="id_recorrido" label="RECORRIDO" className="min-w-[200px]">
               <span className="text-sm font-bold">[{recorrido.codigo}] - {recorrido.nombre}</span>
            </RecordField>
            <RecordField source="estado" label="ESTADO" className="min-w-[100px]">
              <TextField source="estado" className="text-sm font-bold" />
            </RecordField>
          </div>
        </CardContent>
      </Card>

      {/* Caja de Mensaje */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-bold text-primary flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            MENSAJE A ENVIAR
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/80 font-medium italic">
            {record.mensaje || "Contenido no disponible (Verifique si el registro tiene el campo 'mensaje' poblado)"}
          </p>
        </CardContent>
      </Card>

      {/* Ancla para el scroll */}
      <div id="clientes-resumen" className="pt-2">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="space-y-3">
            <h3 className="text-md font-bold text-blue-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-700" />
              Clientes a Contactar
            </h3>
            <ClientMiniTable data={clientesAContactar} />
          </section>

          <section className="space-y-3">
            <h3 className="text-md font-bold text-orange-700 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-orange-700" />
               Clientes sin Comunicación
            </h3>
            <ClientMiniTable data={clientesSinComunicacion} />
          </section>

          <section className="space-y-3">
            <h3 className="text-md font-bold text-red-700 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-red-700" />
               Clientes sin Teléfono
            </h3>
            <ClientMiniTable data={clientesSinTelefono} />
          </section>

          <section className="space-y-3">
            <h3 className="text-md font-bold text-purple-700 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-purple-700" />
               Clientes sin Mail
            </h3>
            <ClientMiniTable data={clientesSinMail} />
          </section>
        </div>
      </div>
    </div>
  );
}

const ClientMiniTable = ({ data }: { data: any[] }) => (
  <div className="border rounded-md overflow-hidden bg-background shadow-sm">
    <Table>
      <TableHeader className="bg-muted/40">
        <TableRow className="h-8">
          <TableHead className="w-[80px] px-2 text-[10px] uppercase font-bold text-muted-foreground">Cód.</TableHead>
          <TableHead className="px-2 text-[10px] uppercase font-bold text-muted-foreground">Razón Social</TableHead>
          <TableHead className="px-2 text-[10px] uppercase font-bold text-muted-foreground">Fantasía</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length > 0 ? (
          data.map((c) => (
            <TableRow key={c.id} className="h-8 hover:bg-muted/20">
              <TableCell className="py-1 px-2 text-xs font-medium">{c.codigo}</TableCell>
              <TableCell className="py-1 px-2 text-xs truncate max-w-[150px]" title={c.razon_social}>{c.razon_social}</TableCell>
              <TableCell className="py-1 px-2 text-xs truncate max-w-[150px]" title={c.nombre_fantasia}>{c.nombre_fantasia}</TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={3} className="h-12 text-center text-[11px] text-muted-foreground italic">
              Sin registros.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </div>
);

export const RecordatorioCreate = () => (
  <Create redirect="list">
    <SimpleForm validate={validateRecordatorio} defaultValues={{ mensaje: DEFAULT_MENSAJE_TEMPLATE }}>
      <MensajeAutoFiller />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DateTimeInput source="envio_mensaje" label="Envío Mensaje" required />
        <DateTimeInput source="fecha_recepcion_pedido" label="Fecha Recepción Pedido" required />
        <DateTimeInput source="entrega_tentativa" label="Entrega Tentativa" required />
        <ReferenceInput 
          source="id_recorrido" 
          reference="recorrido" 
          filter={{ estado: 'Activo' }}
          sort={{ field: 'codigo', order: 'ASC' }}
          perPage={100}
        >
          <SelectInput 
              label="Recorrido"
              optionText={(record: any) => record && record.codigo !== undefined ? `[${record.codigo}] - ${record.nombre}` : ''} 
              optionValue="codigo"
              required 
          />
        </ReferenceInput>
      </div>
      <TextInput source="mensaje" label="Mensaje" multiline rows={8} className="w-full" />
    </SimpleForm>
  </Create>
)

export const RecordatorioEdit = () => (
  <Edit mutationMode="pessimistic" actions={<div className="flex justify-end items-center gap-2"><ShowButton /></div>}>
    <SimpleForm validate={validateRecordatorio}>
      <MensajeAutoFiller />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DateTimeInput source="envio_mensaje" label="Envío Mensaje" required />
        <DateTimeInput source="fecha_recepcion_pedido" label="Fecha Recepción Pedido" required />
        <DateTimeInput source="entrega_tentativa" label="Entrega Tentativa" required />
        <ReferenceInput 
          source="id_recorrido" 
          reference="recorrido" 
          filter={{ estado: 'Activo' }}
          sort={{ field: 'codigo', order: 'ASC' }}
          perPage={100}
        >
          <SelectInput 
              label="Recorrido"
              optionText={(record: any) => record && record.codigo !== undefined ? `[${record.codigo}] - ${record.nombre}` : ''} 
              optionValue="codigo"
              required 
          />
        </ReferenceInput>
      </div>
      <TextInput source="mensaje" label="Mensaje" multiline rows={8} className="w-full" />
    </SimpleForm>
  </Edit>
)

export const RecordatorioShow = () => (
  <Show 
    title={<RecordatorioTitle />} 
    actions={<RecordatorioActions />}
  >
    <RecordatorioShowLayout />
  </Show>
)

const RecordatorioTitle = () => {
  const record = useRecordContext();
  return <span>{record ? `Recordatorio #${record.id}` : 'Recordatorio'}</span>;
};
