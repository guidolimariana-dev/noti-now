import { 
  List, 
  DataTable, 
  TextField, 
  NumberField,
  EditButton,
  ShowButton,
  Create,
  Edit,
  Show,
  SimpleForm,
  TextInput,
  NumberInput,
  SimpleShowLayout
} from '@/components/admin'

export const RecorridoList = () => (
  <List>
    <DataTable bulkActionButtons={false}>
      <NumberField source="id" />
      <NumberField source="codigo" />
      <TextField source="nombre" />
      <TextField source="estado" />
      <EditButton />
      <ShowButton />
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
  <Show>
    <SimpleShowLayout>
      <NumberField source="id" />
      <NumberField source="codigo" />
      <TextField source="nombre" />
      <TextField source="estado" />
    </SimpleShowLayout>
  </Show>
)
