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
} from '@/components/admin'

export const RecorridoList = () => (
  <List
    actions={
      <div className="flex items-center gap-2">
        <FilterForm filters={[<TextInput source="q" alwaysOn />]} />
        <CreateButton />
      </div>
    }
  >
    <DataTable bulkActionButtons={false} rowClick="show">
      <DataTable.Col source="codigo" />
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
      <TextInput source="estado" required />
    </SimpleForm>
  </Create>
)

export const RecorridoEdit = () => (
  <Edit mutationMode="pessimistic" actions={<div className="flex justify-end items-center gap-2"><ShowButton /></div>}>
    <SimpleForm>
      <NumberInput source="codigo" required disabled />
      <TextInput source="nombre" required />
      <TextInput source="estado" required />
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
