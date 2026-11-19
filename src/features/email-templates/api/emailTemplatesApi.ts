import axiosClient from '@/api/axiosClient';
import type { EmailTemplate, EmailTemplatesPage, TemplateInput } from '../types';

export async function getTemplates(): Promise<EmailTemplatesPage> {
  const { data } = await axiosClient.get<EmailTemplatesPage>('/email-templates');
  return data;
}

export async function saveTemplate(type: string, input: TemplateInput): Promise<EmailTemplate> {
  const { data } = await axiosClient.put<{ data: EmailTemplate }>(`/email-templates/${type}`, input);
  return data.data;
}

export async function resetTemplate(type: string): Promise<EmailTemplate> {
  const { data } = await axiosClient.post<{ data: EmailTemplate }>(`/email-templates/${type}/reset`);
  return data.data;
}

/** The unsaved wording rendered with sample data. */
export async function previewTemplate(type: string, draft: TemplateInput): Promise<TemplateInput> {
  const { data } = await axiosClient.post<{ data: TemplateInput }>(`/email-templates/${type}/preview`, draft);
  return data.data;
}

/** A test with sample data to the signed-in user. */
export async function sendTest(type: string): Promise<{ message: string }> {
  const { data } = await axiosClient.post<{ message: string }>(`/email-templates/${type}/test`);
  return data;
}
