import { FormAlert } from '@/features/auth/components/FormAlert';
import { getApiErrorMessage } from '@/utils/formErrorHandler';

/** A failed load: the API's message (or "We could not load {what}.") and Try again. */
export function LoadError({ error, what, onRetry }: { error: unknown; what: string; onRetry: () => void }) {
  return (
    <FormAlert tone="error">
      <p>{getApiErrorMessage(error, `We could not load ${what}.`)}</p>
      <p>
        <button type="button" className="font-medium underline" onClick={onRetry}>
          Try again
        </button>
      </p>
    </FormAlert>
  );
}
