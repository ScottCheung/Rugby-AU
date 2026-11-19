'use client';

import { useActionState } from 'react';
import { Button, Input } from '@scottcheung/ui/client';
import type { CreatePageState } from '@/app/manager/actions';

export function NewPageForm({
  action,
}: {
  action: (
    previous: CreatePageState,
    formData: FormData,
  ) => Promise<CreatePageState>;
}) {
  const [state, formAction, pending] = useActionState(action, {
    title: '',
    path: '',
  });

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Input
        name="title"
        label="Page title"
        placeholder="About us"
        defaultValue={state.title}
        required
      />
      <Input
        name="path"
        label="Path"
        placeholder="/about"
        hint="The address of the page, for example /about. Use / for the home page."
        defaultValue={state.path}
        required
      />
      {state.error && (
        <p role="alert" className="sc-ui-error">
          {state.error}
        </p>
      )}
      <Button type="submit" loading={pending}>
        Create page
      </Button>
    </form>
  );
}
