import { CreateUserPayload, UserRole } from '@src/features/users/api';

export type { UserRole };

export type BatchUserDefaults = {
  role: UserRole;
  linkedCustomerId: number | null;
  passwordStrategy: 'generate' | 'shared';
  sharedPassword: string;
};

export const INITIAL_BATCH_DEFAULTS: BatchUserDefaults = {
  role: 'Operative',
  linkedCustomerId: null,
  passwordStrategy: 'generate',
  sharedPassword: '',
};

export type BatchCardState = {
  id: string;
  form: CreateUserPayload;
  passwordRevealed: boolean;
  validationError: string | null;
};

export function buildEmptyCard(index: number, defaults: BatchUserDefaults): BatchCardState {
  return {
    id: `card-${index}-${Date.now()}`,
    form: {
      username: '',
      fullName: '',
      email: '',
      role: defaults.role,
      password: defaults.passwordStrategy === 'shared' ? defaults.sharedPassword : '',
      linkedCustomerId: defaults.role === 'Customer' ? defaults.linkedCustomerId : null,
    },
    passwordRevealed: defaults.passwordStrategy === 'shared' || defaults.passwordStrategy === 'generate',
    validationError: null,
  };
}
