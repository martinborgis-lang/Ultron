-- ========================================
-- DIAGNOSTIC APPEL TÉLÉPHONIQUE - ULTRON
-- ========================================

-- Vérifier le dernier appel créé (ID: 85d02093-e3c9-47b0-bd67-b4379ab76cba)
SELECT
    id,
    prospect_id,
    organization_id,
    to_number,
    status,
    scheduled_at,
    started_at,
    ended_at,
    vapi_call_id,
    vapi_assistant_id,
    error_message,
    metadata,
    created_at
FROM phone_calls
WHERE id = '85d02093-e3c9-47b0-bd67-b4379ab76cba'
ORDER BY created_at DESC;

-- Vérifier les 5 derniers appels pour cet organisation
SELECT
    id,
    prospect_id,
    to_number,
    status,
    scheduled_at,
    started_at,
    vapi_call_id,
    error_message,
    created_at
FROM phone_calls
WHERE organization_id = '2740ed23-bffe-423e-a038-abaa231525b3'
ORDER BY created_at DESC
LIMIT 5;

-- Vérifier si le prospect a été créé correctement
SELECT
    id,
    first_name,
    last_name,
    phone,
    email,
    stage_slug,
    created_at
FROM crm_prospects
WHERE id = '138ca078-e1f8-4041-984f-b80053f4701a';

-- Vérifier la configuration voice pour cette organisation
SELECT
    id,
    organization_id,
    agent_name,
    is_enabled,
    vapi_assistant_id,
    working_hours_start,
    working_hours_end,
    working_days,
    call_delay_minutes,
    max_call_duration_seconds,
    created_at
FROM voice_config
WHERE organization_id = '2740ed23-bffe-423e-a038-abaa231525b3'
AND is_enabled = true;