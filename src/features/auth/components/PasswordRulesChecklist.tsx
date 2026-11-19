import { Check, Circle } from 'lucide-react';
import { PASSWORD_RULES } from '../lib/passwordRules';

/** Live ✓/○ list under a new-password field, as in workforce-app. */
export function PasswordRulesChecklist({ password, email }: { password: string; email: string }) {
  return (
    <ul className="grid grid-cols-1 gap-x-4 gap-y-1 text-xs sm:grid-cols-2" aria-label="Password rules">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(password, email);
        return (
          <li key={rule.label} className={`flex items-center gap-1.5 ${ok ? 'text-ok' : 'text-muted-foreground'}`}>
            {ok ? <Check className="size-3.5" aria-hidden /> : <Circle className="size-3" aria-hidden />}
            <span>
              {rule.label}
              <span className="sr-only">{ok ? ' (met)' : ' (not met yet)'}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
