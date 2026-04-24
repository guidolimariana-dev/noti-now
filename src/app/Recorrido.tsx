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
  TextInput,
  NumberInput,
  SimpleShowLayout,
  TextField,
  NumberField,
  CreateButton,
  FilterForm,
  SelectInput,
  RecordField, // Import RecordField
} from '@/components/admin'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useShowContext, useListContext } from 'ra-core' // Import hooks

export const RecorridoList = () => {
  const [open, setOpen] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);

  return (
    <>
      <List
        sort={{ field: 'codigo', order: 'ASC' }}
        filters={[
          <TextInput 
            source="q" 
            label="Buscar" 
            placeholder="Busqueda por nombre o código..." 
            alwaysOn 
            className="w-72"
          />,
          <SelectInput
            source="estado"
            label="Estado"
            choices={[
              { id: 'Activo', name: 'Activo' },
              { id: 'Fuera de Servicio', name: 'Fuera de Servicio' },
            ]}
            emptyText="Busqueda por estado..."
            alwaysOn
            className="w-48"
          />,
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
            source="codigo"
            label="Código"
            conditionalClassName={(record) =>
              !record || !record.estado
                ? 'border-l-4 border-gray-300'
                : record.estado === 'Activo'
                ? 'border-l-4 border-green-500'
                : 'border-l-4 border-red-500'
            }
          />
          <DataTable.Col source="nombre" label="Nombre" />
          <DataTable.Col source="estado" label="Estado" disableSort={true} />
        </DataTable>
        <p className="text-xs text-muted-foreground mt-4 italic">
          *Para ordenar los recorridos de la tabla por nombre, hacer click sobre el nombre de la columna para ordenar alfabeticamente y tocar el simbolo con la flecha para ordenar a la inversa. Igualmente con la columna de los códigos.
        </p>
      </List>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-11/12 sm:w-3/4 md:w-1/2 lg:w-2/5 p-4 flex flex-col">
          {selectedRecordId && (
            <Show id={selectedRecordId} resource="recorrido" title={<RecorridoTitle />} actions={<div />}>
              <div className="flex-1 overflow-y-auto">
                <SimpleShowLayout>
                  <RecordField source="codigo" label="Código">
                    <NumberField source="codigo" className="text-xl" />
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

export const RecorridoCreate = () => (
  <Create redirect="list">
    <SimpleForm>
      <NumberInput source="codigo" required />
      <TextInput source="nombre" required />
      <SelectInput
        source="estado"
        choices={[
          { id: 'Activo', name: 'Activo' },
          { id: 'Fuera de Servicio', name: 'Fuera de Servicio' },
        ]}
        emptyText="Seleccionar estado..."
        required
      />
    </SimpleForm>
  </Create>
)

export const RecorridoEdit = () => (
  <Edit mutationMode="pessimistic" actions={<div className="flex justify-end items-center gap-2"><ShowButton /></div>}>
    <SimpleForm>
      <NumberInput source="codigo" required disabled />
      <TextInput source="nombre" required />
      <SelectInput
        source="estado"
        choices={[
          { id: 'Activo', name: 'Activo' },
          { id: 'Fuera de Servicio', name: 'Fuera de Servicio' },
        ]}
        emptyText="Seleccionar estado..."
        required
      />
    </SimpleForm>
  </Edit>
)

export const RecorridoShow = () => (
  <Show title={<RecorridoTitle />} actions={<div className="flex justify-end items-center gap-2"><EditButton /></div>}>
    <SimpleShowLayout>
      <RecordField source="codigo" label="Código">
        <NumberField source="codigo" className="text-xl" />
      </RecordField>
      <RecordField source="estado" label="Estado">
        <TextField source="estado" className="text-xl" />
      </RecordField>
    </SimpleShowLayout>
  </Show>
)

const RecorridoTitle = () => {
  const { record } = useShowContext();
  return <span>{record ? record.nombre : 'Recorrido'}</span>;
};
