import { describe, expect, it } from 'vitest';
import { templateSchema, textOf } from './emailTemplateSchema';

describe('email template form', () => {
  it('reads an empty editor as no message', () => {
    expect(textOf('<p><br></p>')).toBe('');
    expect(templateSchema.safeParse({ subject: 'Hi', body: '<p>&nbsp;</p>' }).success).toBe(false);
  });

  it('accepts a subject and a message', () => {
    expect(templateSchema.parse({ subject: '  Your PIN  ', body: '<p>{{code}}</p>' })).toEqual({ subject: 'Your PIN', body: '<p>{{code}}</p>' });
  });
});
