'use server';
import { z } from 'zod';
import { sql } from '@vercel/postgres';
// next js use the client routing (cache it) to reduce the amout of req to the server
// we want to clear this cache
import { revalidatePath } from 'next/cache';
// and redirect him (the user)
import { redirect } from 'next/navigation';

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  try {
    await sql`INSERT INTO invoices (customer_id, amount, status,date)
   VALUES(${customerId},${amountInCents},${status},${date})`;
  } catch (error) {
    return {
      message: 'Database Error: Failed to create the invoice.',
    };
  }

  // Calling revalidatePath to clear the client cache and make a new server request.
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100;

  try {
    await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;
  } catch (error) {
    return {
      message: 'Database Error: Failed to update the invoice.',
    };
  }

  // Calling revalidatePath to clear the client cache and make a new server request.
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');
    return {
      message: 'Deleted invoice.',
    };
  } catch (error) {
    return {
      message: 'Database Error: Failed to delete the invoice.',
    };
  }
}
