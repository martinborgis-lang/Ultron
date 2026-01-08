'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Organization } from '@/types';
import { useUser } from './useUser';

export function useOrganization() {
  const { user } = useUser();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function getOrganization() {
      if (!user?.organization_id) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', user.organization_id)
        .single();

      setOrganization(data);
      setLoading(false);
    }

    getOrganization();
  }, [user?.organization_id]);

  return { organization, loading };
}
