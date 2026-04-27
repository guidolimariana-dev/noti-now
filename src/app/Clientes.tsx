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
  SelectInput,
  ReferenceInput,
  ReferenceField,
  RecordField,
} from '@/components/admin'
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { useRecordContext } from 'ra-core'

export const ClienteList = () => {
  const [open, setOpen] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);

  return (
    <>
      <List
        title="Clientes"
        sort={{ field: 'codigo', order: 'ASC' }}
        filters={[
          <TextInput 
            source="q" 
            label="Buscar" 
            placeholder="Busqueda por razón social, fantasía o cuit..." 
            alwaysOn 
            className="w-72"
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
          <DataTable.Col source="codigo" label="Código" />
          <DataTable.Col source="razon_social" label="Razón Social" />
          <DataTable.Col source="nombre_fantasia" label="Nombre Fantasía" />
          <DataTable.Col source="cuit" label="CUIT" />
          <DataTable.Col source="numero_circuito" label="Circuito" />
        </DataTable>
      </List>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-11/12 sm:w-3/4 md:w-1/2 lg:w-2/5 p-4 flex flex-col">
          {selectedRecordId && (
            <Show id={selectedRecordId} resource="clientes" title={<ClienteTitle />} actions={<div />}>
              <div className="flex-1 overflow-y-auto">
                <SimpleShowLayout>
                  <RecordField source="codigo" label="Código">
                    <NumberField source="codigo" />
                  </RecordField>
                  <RecordField source="razon_social" label="Razón Social">
                    <TextField source="razon_social" />
                  </RecordField>
                  <RecordField source="nombre_fantasia" label="Nombre Fantasía">
                    <TextField source="nombre_fantasia" />
                  </RecordField>
                  <RecordField source="cuit" label="CUIT">
                    <TextField source="cuit" />
                  </RecordField>
                  <RecordField source="telefono" label="Teléfono">
                    <TextField source="telefono" />
                  </RecordField>
                  <RecordField source="email" label="Email">
                    <TextField source="email" />
                  </RecordField>
                  <RecordField source="numero_circuito" label="Número Circuito">
                    <ReferenceField source="numero_circuito" reference="recorrido" target="codigo">
                        <TextField source="nombre" />
                    </ReferenceField>
                  </RecordField>
                  <RecordField source="llamar_sn" label="Llamar S/N">
                    <TextField source="llamar_sn" />
                  </RecordField>
                  <RecordField source="forma_contacto" label="Forma Contacto">
                    <TextField source="forma_contacto" />
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

export const ClienteCreate = () => (
  <Create redirect="list">
    <SimpleForm>
      <NumberInput source="codigo" required />
      <TextInput source="razon_social" required />
      <TextInput source="nombre_fantasia" required />
      <TextInput source="cuit" required />
      <TextInput source="telefono" required />
      <TextInput source="email" required />
      <ReferenceInput source="numero_circuito" reference="recorrido" sort={{ field: 'codigo', order: 'ASC' }}>
        <SelectInput optionText="nombre" optionValue="codigo" label="Recorrido" required />
      </ReferenceInput>
      <SelectInput
        source="llamar_sn"
        label="Llamar S/N"
        choices={[
          { id: 'S', name: 'S' },
          { id: 'N', name: 'N' },
        ]}
        required
      />
      <TextInput source="forma_contacto" required />
    </SimpleForm>
  </Create>
)

export const ClienteEdit = () => (
  <Edit mutationMode="pessimistic" actions={<div className="flex justify-end items-center gap-2"><ShowButton /></div>}>
    <SimpleForm>
      <NumberInput source="codigo" required />
      <TextInput source="razon_social" required />
      <TextInput source="nombre_fantasia" required />
      <TextInput source="cuit" required />
      <TextInput source="telefono" required />
      <TextInput source="email" required />
      <ReferenceInput source="numero_circuito" reference="recorrido" sort={{ field: 'codigo', order: 'ASC' }}>
        <SelectInput optionText="nombre" optionValue="codigo" label="Recorrido" required />
      </ReferenceInput>
      <SelectInput
        source="llamar_sn"
        label="Llamar S/N"
        choices={[
          { id: 'S', name: 'S' },
          { id: 'N', name: 'N' },
        ]}
        required
      />
      <TextInput source="forma_contacto" required />
    </SimpleForm>
  </Edit>
)

export const ClienteShow = () => (
  <Show title={<ClienteTitle />} actions={<div className="flex justify-end items-center gap-2"><EditButton /></div>}>
    <SimpleShowLayout>
        <NumberField source="codigo" />
        <TextField source="razon_social" />
        <TextField source="nombre_fantasia" />
        <TextField source="cuit" />
        <TextField source="telefono" />
        <TextField source="email" />
        <ReferenceField source="numero_circuito" reference="recorrido" target="codigo">
            <TextField source="nombre" />
        </ReferenceField>
        <TextField source="llamar_sn" />
        <TextField source="forma_contacto" />
    </SimpleShowLayout>
  </Show>
)

const ClienteTitle = () => {
  const record = useRecordContext();
  return <span>{record ? record.razon_social : 'Cliente'}</span>;
};
