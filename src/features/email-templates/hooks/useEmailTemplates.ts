import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getTemplates, previewTemplate, resetTemplate, saveTemplate, sendTest } from '../api/emailTemplatesApi';
import type { TemplateInput } from '../types';

export const emailKeys = {
  all: ['email-templates'] as const,
  list: () => [...emailKeys.all, 'list'] as const,
  preview: (type: string, subject: string, body: string) => [...emailKeys.all, 'preview', type, subject, body] as const,
};

export const useTemplates = () => useQuery({ queryKey: emailKeys.list(), queryFn: getTemplates });

/** The preview of unsaved wording (pass the debounced draft). */
export const useTemplatePreview = (type: string, subject: string, body: string) =>
  useQuery({
    queryKey: emailKeys.preview(type, subject, body),
    queryFn: () => previewTemplate(type, { subject, body }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

function useEmailMutation<V, R>(fn: (vars: V) => Promise<R>) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => void queryClient.invalidateQueries({ queryKey: emailKeys.list() }) });
}

export const useSaveTemplate = () => useEmailMutation(({ type, input }: { type: string; input: TemplateInput }) => saveTemplate(type, input));
export const useResetTemplate = () => useEmailMutation((type: string) => resetTemplate(type));
export const useSendTest = () => useMutation({ mutationFn: (type: string) => sendTest(type) });
