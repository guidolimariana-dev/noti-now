import { Create, Edit, SimpleForm, TextInput } from '@/components/admin'
import { required } from 'ra-core'

export const TodoCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="descripcion" label="Descripción" type="text" validate={required()} />
    </SimpleForm>
  </Create>
)

export const TodoEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="descripcion" label="Descripción" type="text" validate={required()} />
    </SimpleForm>
  </Edit>
)
