import { describe, it, expect } from 'vitest';
import { CreateUserSchema, CreatePromptSchema, VoteSchema, UsageSchema } from '../../../lib/validation';

describe('CreateUserSchema', () => {
  it('accepts valid input', () => {
    const result = CreateUserSchema.safeParse({ name: 'Anna', department: 'IT' });
    expect(result.success).toBe(true);
  });
  it('rejects empty name', () => {
    const result = CreateUserSchema.safeParse({ name: '', department: 'IT' });
    expect(result.success).toBe(false);
  });
  it('rejects missing name', () => {
    const result = CreateUserSchema.safeParse({ department: 'IT' });
    expect(result.success).toBe(false);
  });
});

describe('CreatePromptSchema', () => {
  const valid = {
    title: 'Test Prompt',
    titleEn: 'Test Prompt EN',
    content: 'This is the prompt content',
    contentEn: 'This is the English content',
    category: 'Writing',
    difficulty: 'Einstieg',
    authorId: 1,
  };
  it('accepts valid input', () => {
    expect(CreatePromptSchema.safeParse(valid).success).toBe(true);
  });
  it('rejects invalid category', () => {
    expect(CreatePromptSchema.safeParse({ ...valid, category: 'Invalid' }).success).toBe(false);
  });
  it('rejects invalid difficulty', () => {
    expect(CreatePromptSchema.safeParse({ ...valid, difficulty: 'Hard' }).success).toBe(false);
  });
  it('rejects missing title', () => {
    const { title, ...rest } = valid;
    expect(CreatePromptSchema.safeParse(rest).success).toBe(false);
  });
});

describe('VoteSchema', () => {
  it('accepts value 1', () => expect(VoteSchema.safeParse({ promptId: 1, userId: 1, value: 1 }).success).toBe(true));
  it('accepts value 5', () => expect(VoteSchema.safeParse({ promptId: 1, userId: 1, value: 5 }).success).toBe(true));
  it('rejects value 0', () => expect(VoteSchema.safeParse({ promptId: 1, userId: 1, value: 0 }).success).toBe(false));
  it('rejects value 6', () => expect(VoteSchema.safeParse({ promptId: 1, userId: 1, value: 6 }).success).toBe(false));
});

describe('UsageSchema', () => {
  it('accepts valid promptId', () => expect(UsageSchema.safeParse({ promptId: 1 }).success).toBe(true));
  it('rejects missing promptId', () => expect(UsageSchema.safeParse({}).success).toBe(false));
});
