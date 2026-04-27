import { useState } from 'react';
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
  SimpleShowLayout,
  TextField,
  DateField,
  RecordField,
  ReferenceField,
  ReferenceInput,
  CreateButton,
} from '@/components/admin'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useShowContext } from 'ra-core'

// Validación personalizada
const validateRecordatorio = (values: any) => {
  const errors: any = {};
  const now = new Date();
  
  if (!values.fecha_envio) {
    errors.fecha_envio = 'Campo faltante. Es necesario que complete el campo \'Fecha Envío\' para guardar los cambios.';
  } else {
    const envio = new Date(values.fecha_envio);
    if (!isNaN(envio.getTime()) && envio < new Date(now.setSeconds(0, 0))) {
      errors.fecha_envio = 'La fecha de envío no puede ser anterior a la fecha actual.';
    }
  }

  if (!values.fecha_limite) {
    errors.fecha_limite = 'Campo faltante. Es necesario que complete el campo \'Fecha Límite\' para guardar los cambios.';
  } else if (values.fecha_envio) {
    const envio = new Date(values.fecha_envio);
    const limite = new Date(values.fecha_limite);
    if (!isNaN(envio.getTime()) && !isNaN(limite.getTime()) && limite <= envio) {
      errors.fecha_limite = 'La fecha límite debe ser posterior a la fecha de envío.';
    }
  }

  if (!values.id_recorrido) {
    errors.id_recorrido = 'Campo faltante. Es necesario que complete el campo \'Recorrido\' para guardar los cambios.';
  }

  if (!values.estado) {
    errors.estado = 'Campo faltante. Es necesario que complete el campo \'Estado\' para guardar los cambios.';
  }

  return errors;
};

export const RecordatorioList = () => {
  const [open, setOpen] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);

  return (
    <>
      <List
        title="Recordatorios"
        sort={{ field: 'id', order: 'DESC' }}
        filters={[
          <TextInput 
            source="q" 
            label="Buscar" 
            placeholder="Buscar por fecha de envío..." 
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
            alwaysOn
          >
            <SelectInput 
              label="Recorrido" 
              optionText="nombre" 
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
          rowClick={(id) => {
            setSelectedRecordId(id as number);
            setOpen(true);
            return false;
          }}
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
          <DataTable.Col source="fecha_envio" label="Fecha Envío">
             <DateField source="fecha_envio" showTime />
          </DataTable.Col>
          <DataTable.Col source="fecha_limite" label="Fecha Límite" disableSort={true}>
             <DateField source="fecha_limite" showTime />
          </DataTable.Col>
          <DataTable.Col source="estado" label="Estado" disableSort={true} />
          <DataTable.Col source="id_recorrido" label="Recorrido" disableSort={true}>
            <ReferenceField source="id_recorrido" reference="recorrido" link={false}>
               <TextField source="nombre" />
            </ReferenceField>
          </DataTable.Col>
        </DataTable>
        <p className="text-xs text-muted-foreground mt-4 italic">
            *Para ordenar los recorridos de la tabla por su feche de envío, hacer click sobre el nombre de la columna para ordenar alfabeticamente y tocar el simbolo con la flecha para ordenar a la inversa. Igualmente con la columna de los identificadores.
        </p>
      </List>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-11/12 sm:w-3/4 md:w-1/2 lg:w-2/5 p-4 flex flex-col">
          {selectedRecordId && (
            <Show id={selectedRecordId} resource="recordatorio" title={<RecordatorioTitle />} actions={<div />}>
              <div className="flex-1 overflow-y-auto">
                <SimpleShowLayout>
                  <RecordField source="id" label="ID">
                    <TextField source="id" className="text-xl" />
                  </RecordField>
                  <RecordField source="fecha_envio" label="Fecha Envío">
                    <DateField source="fecha_envio" showTime className="text-xl" />
                  </RecordField>
                  <RecordField source="fecha_limite" label="Fecha Límite">
                    <DateField source="fecha_limite" showTime className="text-xl" />
                  </RecordField>
                  <RecordField source="id_recorrido" label="Recorrido">
                    <ReferenceField source="id_recorrido" reference="recorrido" link={false}>
                       <RecordatorioRecorridoField />
                    </ReferenceField>
                  </RecordField>
                  <RecordField source="estado" label="Estado">
                    <TextField source="estado" className="text-xl" />
                  </RecordField>
                </SimpleShowLayout>
              </div>
              <div className="mt-auto pt-6 flex justify-end border-t">
                <EditButton />
              </div>
            </Show>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

const RecordatorioRecorridoField = () => {
  const { record } = useShowContext();
  if (!record) return null;
  return <span className="text-xl">[{record.codigo}] - {record.nombre}</span>;
}

export const RecordatorioCreate = () => (
  <Create redirect="list">
    <SimpleForm validate={validateRecordatorio}>
      <DateTimeInput source="fecha_envio" required />
      <DateTimeInput source="fecha_limite" required />
      <ReferenceInput 
        source="id_recorrido" 
        reference="recorrido" 
        filter={{ estado: 'Activo' }}
        sort={{ field: 'codigo', order: 'ASC' }}
      >
        <SelectInput 
            label="Recorrido"
            optionText={(record: any) => record && record.codigo !== undefined ? `[${record.codigo}] - ${record.nombre}` : ''} 
            optionValue="id"
            required 
        />
      </ReferenceInput>
      <SelectInput
        source="estado"
        choices={[
          { id: 'Programado', name: 'Programado' },
          { id: 'Enviado', name: 'Enviado' },
          { id: 'Cancelado', name: 'Cancelado' },
        ]}
        required
      />
    </SimpleForm>
  </Create>
)

export const RecordatorioEdit = () => (
  <Edit mutationMode="pessimistic" actions={<div className="flex justify-end items-center gap-2"><ShowButton /></div>}>
    <SimpleForm validate={validateRecordatorio}>
      <DateTimeInput source="fecha_envio" required />
      <DateTimeInput source="fecha_limite" required />
      <ReferenceInput 
        source="id_recorrido" 
        reference="recorrido" 
        filter={{ estado: 'Activo' }}
        sort={{ field: 'codigo', order: 'ASC' }}
      >
        <SelectInput 
            label="Recorrido"
            optionText={(record: any) => record && record.codigo !== undefined ? `[${record.codigo}] - ${record.nombre}` : ''} 
            optionValue="id"
            required 
        />
      </ReferenceInput>
      <SelectInput
        source="estado"
        choices={[
          { id: 'Programado', name: 'Programado' },
          { id: 'Enviado', name: 'Enviado' },
          { id: 'Cancelado', name: 'Cancelado' },
        ]}
        required
      />
    </SimpleForm>
  </Edit>
)

export const RecordatorioShow = () => (
  <Show title={<RecordatorioTitle />} actions={<div className="flex justify-end items-center gap-2"><EditButton /></div>}>
    <SimpleShowLayout>
      <RecordField source="id" label="ID">
        <TextField source="id" className="text-xl" />
      </RecordField>
      <RecordField source="fecha_envio" label="Fecha Envío">
        <DateField source="fecha_envio" showTime className="text-xl" />
      </RecordField>
      <RecordField source="fecha_limite" label="Fecha Límite">
        <DateField source="fecha_limite" showTime className="text-xl" />
      </RecordField>
      <RecordField source="id_recorrido" label="Recorrido">
        <ReferenceField source="id_recorrido" reference="recorrido" link={false}>
            <RecordatorioRecorridoField />
        </ReferenceField>
      </RecordField>
      <RecordField source="estado" label="Estado">
        <TextField source="estado" className="text-xl" />
      </RecordField>
    </SimpleShowLayout>
  </Show>
)

const RecordatorioTitle = () => {
  const { record } = useShowContext();
  return <span>{record ? `Recordatorio #${record.id}` : 'Recordatorio'}</span>;
};
