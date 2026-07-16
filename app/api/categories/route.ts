/**
 * GET  /api/categories – Returns all active prompt categories ordered by
 *      display order. Used by the Library filter, Submit form, and Admin panel.
 * POST /api/categories – A signed-in user creates a new category on the fly
 *      when submitting a prompt (CR-004). No admin session required.
 */
import { NextRequest, NextResponse } from 'next/server';
import { readLimiter, writeLimiter, getClientIp } from '@/lib/rate-limit';
import { requireUser } from '@/lib/route-auth';
import { CreateCategorySchema, validationError } from '@/lib/validation';
import {
  listCategories,
  createCategory,
  InvalidCategoryLabelError,
  CategorySlugTakenError,
} from '@/lib/services/category-service';

// @spec AC-02-010
export async function GET(req: NextRequest) {
  if (!readLimiter.check(getClientIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const categories = await listCategories();

  return NextResponse.json(categories, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  });
}

// @spec AC-02-013
export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if ('response' in auth) return auth.response;

  if (!writeLimiter.check(getClientIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = CreateCategorySchema.safeParse(body);
  if (!parsed.success) {
    const { status, body: errBody } = validationError(parsed.error);
    return NextResponse.json(errBody, { status });
  }

  try {
    const category = await createCategory(parsed.data.label);
    return NextResponse.json(category, { status: 201 });
  } catch (err) {
    if (err instanceof InvalidCategoryLabelError) {
      return NextResponse.json({ error: 'label: Enthält keine gültigen Zeichen für eine Kategorie' }, { status: 400 });
    }
    if (err instanceof CategorySlugTakenError) {
      return NextResponse.json({ error: 'Kategorie existiert bereits' }, { status: 409 });
    }
    throw err;
  }
}
