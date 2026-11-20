'use client';

import { Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { Button, Dialog } from '@scottcheung/ui/client';
import { deletePageAction } from '@/app/manager/actions';

/** Delete with a confirmation step; the action returns to the page list. */
export function DeletePageButton({
  pageId,
  title,
}: {
  pageId: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [deleting, startDeleting] = useTransition();

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="self-start text-red-600"
        onClick={() => setOpen(true)}
      >
        <Trash2 /> Delete page
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={`Delete “${title}”?`}
        description="The page and everything on it will be removed and its address will show “Page not found”. This cannot be undone."
      >
        {error && <p className="sc-ui-error">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={deleting}
            onClick={() =>
              startDeleting(async () => {
                // On success the action redirects, so only errors come back.
                const result = await deletePageAction(pageId);
                setError(result.error);
              })
            }
          >
            {deleting ? 'Deleting…' : 'Delete page'}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
