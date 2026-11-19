import { describe, expect, it } from 'vitest';
import { passwordMeetsRules, PASSWORD_RULES } from './passwordRules';

describe('password rules', () => {
  it('accepts a password that meets every rule', () => {
    expect(passwordMeetsRules('Demo@2026', 'nomsa@example.co.za')).toBe(true);
  });

  it.each([
    ['Ab1!', 'too short'],
    ['Password!!', 'no digit'],
    ['Password12', 'no symbol'],
  ])('rejects %s (%s)', (pw) => {
    expect(passwordMeetsRules(pw, 'nomsa@example.co.za')).toBe(false);
  });

  it('rejects the email name, whatever the case', () => {
    const rule = PASSWORD_RULES[3];
    expect(rule.test('Thandi.1!', 'thandi.1!@example.co.za')).toBe(false);
    expect(rule.test('THANDI.1!', 'thandi.1!@example.co.za')).toBe(false);
  });
});
