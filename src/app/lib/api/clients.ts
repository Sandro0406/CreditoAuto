import { supabase } from '../supabase';
import { notifyClientCreated } from '../notify';
import { clientFromRow, clientToInsert } from './mappers';
import type { Cliente } from '../types';

export async function getClients(): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(clientFromRow);
}

export async function createClient(
  userId: string,
  input: Omit<Cliente, 'id_cliente' | 'fecha_registro'>
): Promise<Cliente> {
  const { data, error } = await supabase
    .from('clients')
    .insert(clientToInsert(userId, input))
    .select()
    .single();

  if (error) throw error;
  const cliente = clientFromRow(data);
  await notifyClientCreated(cliente.nombre_cliente).catch(() => undefined);
  return cliente;
}

export async function updateClient(cliente: Cliente): Promise<Cliente> {
  const { data, error } = await supabase
    .from('clients')
    .update({
      full_name: cliente.nombre_cliente,
      document_number: cliente.dni_cliente,
      phone: cliente.telefono_cliente,
      address: cliente.direccion_cliente || null,
    })
    .eq('id', Number(cliente.id_cliente))
    .select()
    .single();

  if (error) throw error;
  return clientFromRow(data);
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase.from('clients').delete().eq('id', Number(id));
  if (error) throw error;
}
