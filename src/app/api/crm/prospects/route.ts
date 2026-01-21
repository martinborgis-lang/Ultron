import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { validateFilters, createSafeSearchPattern } from '@/lib/validation/sql-injection-protection';
import { errorResponse, unauthorized } from '@/lib/errors';

export const dynamic = 'force-dynamic';

// GET : Liste des prospects avec filtres
export async function GET(request: NextRequest) {
  try {
    // Auth check with regular client
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return unauthorized();
    }

    // Use admin client for database operations (bypasses RLS)
    const adminClient = createAdminClient();

    // Récupérer l'organization_id de l'utilisateur
    const { data: userData } = await adminClient
      .from('users')
      .select('organization_id')
      .eq('auth_id', user.id)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: 'Organisation non trouvée' }, { status: 404 });
    }

    // ✅ SÉCURITÉ: Validation complète des paramètres
    const safeFilters = validateFilters(request.nextUrl.searchParams);

    let query = adminClient
      .from('crm_prospects')
      .select(`
        *,
        stage:pipeline_stages(id, name, slug, color, position),
        assigned_user:users!crm_prospects_assigned_to_fkey(id, full_name, email)
      `, { count: 'exact' })
      .eq('organization_id', userData.organization_id)
      .order(safeFilters.sort_field || 'created_at', { ascending: safeFilters.sort_order === 'asc' });

    // ✅ SÉCURITÉ: Filtres avec validation
    if (safeFilters.search) {
      const searchPattern = createSafeSearchPattern(safeFilters.search);
      query = query.or(`first_name.ilike.${searchPattern},last_name.ilike.${searchPattern},email.ilike.${searchPattern},company.ilike.${searchPattern},phone.ilike.${searchPattern}`);
    }

    if (safeFilters.stages && safeFilters.stages.length > 0) {
      query = query.in('stage_slug', safeFilters.stages);
    }

    if (safeFilters.qualifications && safeFilters.qualifications.length > 0) {
      query = query.in('qualification', safeFilters.qualifications);
    }

    if (safeFilters.assigned_to) {
      query = query.eq('assigned_to', safeFilters.assigned_to);
    }

    // ✅ SÉCURITÉ: Pagination validée
    const offset = safeFilters.offset || 0;
    const limit = safeFilters.limit || 50;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      prospects: data,
      total: count,
      limit,
      offset
    });

  } catch (error) {
    return errorResponse(error);
  }
}

// POST : Creer un nouveau prospect
export async function POST(request: NextRequest) {
  try {
    // Auth check with regular client
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return unauthorized();
    }

    // Use admin client for database operations (bypasses RLS)
    const adminClient = createAdminClient();

    const { data: userData } = await adminClient
      .from('users')
      .select('id, organization_id')
      .eq('auth_id', user.id)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: 'Organisation non trouvee' }, { status: 404 });
    }

    const body = await request.json();

    // ✅ SÉCURITÉ: Validation des données entrantes
    const {
      validateStage,
      validateQualification,
      validateUUID,
      sanitizeSearch
    } = await import('@/lib/validation/sql-injection-protection');

    const safeStageSlug = validateStage(body.stage_slug) || 'nouveau';
    const safeQualification = validateQualification(body.qualification) || 'non_qualifie';
    const safeAssignedTo = validateUUID(body.assigned_to) || userData.id;

    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const safeEmail = body.email && emailRegex.test(body.email) ? body.email : null;

    // Validation des champs texte
    const safeFirstName = sanitizeSearch(body.first_name);
    const safeLastName = sanitizeSearch(body.last_name);
    const safeCompany = sanitizeSearch(body.company);
    const safeJobTitle = sanitizeSearch(body.job_title);
    const safeCity = sanitizeSearch(body.city);
    const safeNotes = sanitizeSearch(body.notes);

    // Validation numérique
    const safeDealValue = body.deal_value && !isNaN(parseFloat(body.deal_value))
      ? Math.max(0, parseFloat(body.deal_value))
      : null;

    const safeCloseProbability = body.close_probability && !isNaN(parseInt(body.close_probability))
      ? Math.min(Math.max(parseInt(body.close_probability), 0), 100)
      : 50;

    const { data: stageData, error: stageError } = await adminClient
      .from('pipeline_stages')
      .select('id, slug')
      .eq('organization_id', userData.organization_id)
      .eq('slug', safeStageSlug)
      .single();

    // Preparer les donnees du prospect avec validation
    const prospectData = {
      organization_id: userData.organization_id,
      first_name: safeFirstName || null,
      last_name: safeLastName || null,
      email: safeEmail,
      phone: body.phone?.replace(/[^+\d\s()-]/g, '') || null, // Garder seulement chiffres et caractères téléphone valides
      company: safeCompany || null,
      job_title: safeJobTitle || null,
      city: safeCity || null,
      address: body.address?.substring(0, 200) || null, // Limiter longueur
      postal_code: body.postal_code?.replace(/[^\d\s-]/g, '') || null, // Seulement chiffres, espaces, tirets
      stage_id: stageData?.id || null,
      stage_slug: stageData?.slug || safeStageSlug,
      deal_value: safeDealValue,
      close_probability: safeCloseProbability,
      notes: safeNotes || null,
      source: body.source?.substring(0, 50) || 'manual', // Limiter longueur
      assigned_to: safeAssignedTo,
      tags: Array.isArray(body.tags) ? body.tags.slice(0, 10) : [], // Limiter nombre de tags
      qualification: safeQualification,
    };

    const { data, error } = await adminClient
      .from('crm_prospects')
      .insert(prospectData)
      .select(`
        *,
        stage:pipeline_stages(id, name, slug, color),
        assigned_user:users!crm_prospects_assigned_to_fkey(id, full_name, email)
      `)
      .single();

    if (error) {
      throw error;
    }

    // Creer une activite pour la creation
    await adminClient.from('crm_activities').insert({
      organization_id: userData.organization_id,
      prospect_id: data.id,
      user_id: userData.id,
      type: 'note',
      subject: 'Prospect cree',
      content: 'Prospect cree manuellement',
    });

    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    return errorResponse(error);
  }
}
