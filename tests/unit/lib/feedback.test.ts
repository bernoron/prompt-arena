// @spec AC-11-003
import { describe, it, expect } from 'vitest';
import {
  FeedbackSchema,
  LessonFeedbackSchema,
  LessonFeedbackUpdateSchema,
  TopicSuggestionSchema,
  AdminFeedbackStatusSchema,
  SuggestionStatusSchema,
} from '../../../lib/validation';

// ─── FeedbackSchema ───────────────────────────────────────────────────────────

describe('FeedbackSchema', () => {
  const valid = {
    category: 'BUG' as const,
    text:     'Something is broken',
  };

  it('accepts minimal valid input', () => {
    expect(FeedbackSchema.safeParse(valid).success).toBe(true);
  });

  it('defaults contextType to GENERAL', () => {
    const result = FeedbackSchema.safeParse(valid);
    expect(result.success && result.data.contextType).toBe('GENERAL');
  });

  it('accepts all four categories', () => {
    for (const cat of ['BUG', 'IMPROVEMENT', 'IDEA', 'PRAISE']) {
      expect(FeedbackSchema.safeParse({ ...valid, category: cat }).success).toBe(true);
    }
  });

  it('rejects unknown category', () => {
    expect(FeedbackSchema.safeParse({ ...valid, category: 'COMPLAIN' }).success).toBe(false);
  });

  it('rejects empty text', () => {
    expect(FeedbackSchema.safeParse({ ...valid, text: '' }).success).toBe(false);
  });

  it('rejects text over 500 chars', () => {
    expect(FeedbackSchema.safeParse({ ...valid, text: 'x'.repeat(501) }).success).toBe(false);
  });

  it('rejects missing category', () => {
    const { category, ...rest } = valid;
    expect(FeedbackSchema.safeParse(rest).success).toBe(false);
  });

  it('accepts optional contextId and contextPath', () => {
    const result = FeedbackSchema.safeParse({
      ...valid,
      contextType: 'LESSON',
      contextId: 5,
      contextPath: '/learn/basics/intro',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid contextType', () => {
    expect(FeedbackSchema.safeParse({ ...valid, contextType: 'MODULE' }).success).toBe(false);
  });
});

// ─── LessonFeedbackSchema ─────────────────────────────────────────────────────

describe('LessonFeedbackSchema', () => {
  const valid = { lessonId: 2, helpful: true };

  it('accepts minimal valid input', () => {
    expect(LessonFeedbackSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts helpful=false', () => {
    expect(LessonFeedbackSchema.safeParse({ ...valid, helpful: false }).success).toBe(true);
  });

  it('accepts optional text', () => {
    expect(LessonFeedbackSchema.safeParse({ ...valid, text: 'Great!' }).success).toBe(true);
  });

  it('rejects text over 500 chars', () => {
    expect(LessonFeedbackSchema.safeParse({ ...valid, text: 'x'.repeat(501) }).success).toBe(false);
  });

  it('rejects missing helpful', () => {
    const { helpful, ...rest } = valid;
    expect(LessonFeedbackSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects non-boolean helpful', () => {
    expect(LessonFeedbackSchema.safeParse({ ...valid, helpful: 'yes' }).success).toBe(false);
  });
});

// ─── LessonFeedbackUpdateSchema ───────────────────────────────────────────────

describe('LessonFeedbackUpdateSchema', () => {
  it('accepts empty update (all optional)', () => {
    expect(LessonFeedbackUpdateSchema.safeParse({}).success).toBe(true);
  });

  it('accepts helpful update only', () => {
    expect(LessonFeedbackUpdateSchema.safeParse({ helpful: false }).success).toBe(true);
  });

  it('accepts text update only', () => {
    expect(LessonFeedbackUpdateSchema.safeParse({ text: 'Updated!' }).success).toBe(true);
  });
});

// ─── TopicSuggestionSchema ────────────────────────────────────────────────────

describe('TopicSuggestionSchema', () => {
  const valid = { title: 'Advanced RAG techniques' };

  it('accepts minimal valid input', () => {
    expect(TopicSuggestionSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects title shorter than 3 chars', () => {
    expect(TopicSuggestionSchema.safeParse({ ...valid, title: 'AB' }).success).toBe(false);
  });

  it('rejects title over 200 chars', () => {
    expect(TopicSuggestionSchema.safeParse({ ...valid, title: 'x'.repeat(201) }).success).toBe(false);
  });

  it('accepts optional description', () => {
    expect(TopicSuggestionSchema.safeParse({ ...valid, description: 'Would help with...' }).success).toBe(true);
  });

  it('rejects description over 500 chars', () => {
    expect(TopicSuggestionSchema.safeParse({ ...valid, description: 'x'.repeat(501) }).success).toBe(false);
  });
});

// ─── AdminFeedbackStatusSchema ────────────────────────────────────────────────

describe('AdminFeedbackStatusSchema', () => {
  it('accepts OPEN', () => {
    expect(AdminFeedbackStatusSchema.safeParse({ status: 'OPEN' }).success).toBe(true);
  });
  it('accepts DONE', () => {
    expect(AdminFeedbackStatusSchema.safeParse({ status: 'DONE' }).success).toBe(true);
  });
  it('rejects unknown status', () => {
    expect(AdminFeedbackStatusSchema.safeParse({ status: 'ARCHIVED' }).success).toBe(false);
  });
});

// ─── SuggestionStatusSchema ───────────────────────────────────────────────────

describe('SuggestionStatusSchema', () => {
  for (const s of ['OPEN', 'PLANNED', 'DONE', 'REJECTED']) {
    it(`accepts ${s}`, () => {
      expect(SuggestionStatusSchema.safeParse({ status: s }).success).toBe(true);
    });
  }
  it('rejects unknown status', () => {
    expect(SuggestionStatusSchema.safeParse({ status: 'PENDING' }).success).toBe(false);
  });
});
