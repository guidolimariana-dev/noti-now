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
} from '@/components/admin'

export const RecorridoList = () => (
  <List
    filters={[
      <TextInput source="q" label="Buscar" alwaysOn />,
      <SelectInput
        source="estado"
        label="Estado"
        choices={[
          { id: 'Activo', name: 'Activo' },
          { id: 'Fuera de Servicio', name: 'Fuera de Servicio' },
        ]}
        alwaysOn
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
      rowClick="show"
    >
      <DataTable.Col
        source="codigo"
        conditionalClassName={(record) =>
          !record || !record.estado
            ? 'border-l-4 border-gray-300'
            : record.estado === 'Activo'
            ? 'border-l-4 border-green-500'
            : 'border-l-4 border-red-500'
        }
      />
      <DataTable.Col source="nombre" />
      <DataTable.Col source="estado" />
    </DataTable>
  </List>
)

export const RecorridoCreate = () => (
  <Create>
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
  <Show actions={<div className="flex justify-end items-center gap-2"><EditButton /></div>}>
    <SimpleShowLayout>
      <NumberField source="id" />
      <NumberField source="codigo" />
      <TextField source="nombre" />
      <TextField source="estado" />
    </SimpleShowLayout>
  </Show>
)
