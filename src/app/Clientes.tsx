import { useState, useRef } from 'react';
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
  SelectInput,
  ReferenceInput,
  ReferenceField,
  RecordField,
} from '@/components/admin'
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { useRecordContext, useNotify, useRefresh } from 'ra-core'
import { uploadToR2Fn, processFileFromR2Fn } from '@/server/db-functions';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

const ImportButton = () => {
  const notify = useNotify();
  const refresh = useRefresh();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // 1. Upload to R2
      const { filename } = await uploadToR2Fn({ data: formData });

      // 2. Process from R2
      await processFileFromR2Fn({
        data: {
          filename,
          resource: 'clientes'
        }
      });

      notify('Carga de archivo completa!', { type: 'success' });
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      setTimeout(() => {
        refresh();
      }, 500);
    } catch (error: any) {
      console.error(error);
      notify(error.message || 'Error al importar clientes', { type: 'error' });
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <input
        type="file"
        accept=".xlsx, .xls"
        className="hidden"
        ref={fileInputRef}
        onChange={handleImport}
        disabled={importing}
      />
      <Button 
        variant="outline" 
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-2"
        disabled={importing}
      >
        <Upload className="w-4 h-4" />
        {importing ? 'Importando...' : 'Importar'}
      </Button>
    </>
  );
};

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
            placeholder="Busqueda por código, razón social o fantasía..." 
            alwaysOn 
            className="w-[450px]"
          />,
          <ReferenceInput 
            source="numero_circuito" 
            reference="recorrido" 
            sort={{ field: 'codigo', order: 'ASC' }}
            alwaysOn
          >
            <SelectInput 
              label="Circuito"
              emptyText="Filtrar por recorrido..."
              optionText={(record: any) => record ? `[${record.codigo}] - ${record.nombre}` : ''}
              optionValue="codigo" 
              className="w-72" 
            />
          </ReferenceInput>
        ]}
        actions={
          <div className="flex items-center gap-2">
            <ImportButton />
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
          <DataTable.Col source="codigo" label="Código" sortable />
          <DataTable.Col source="razon_social" label="Razón Social" sortable={false} />
          <DataTable.Col source="nombre_fantasia" label="Nombre Fantasía" sortable={false} />
          <DataTable.Col source="cuit" label="CUIT" sortable={false} />
          <DataTable.Col source="numero_circuito" label="Circuito" sortable={false} />
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
                  <RecordField source="numero_circuito" label="Circuito">
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
