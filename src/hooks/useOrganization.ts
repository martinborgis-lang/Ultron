'use client';

import { useEffect, useState } from 'react';
import type { Organization } from '@/types';

export function useOrganization() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getOrganization() {
      try {
        const response = await fetch('/api/user/me');
        if (response.ok) {
          const data = await response.json();
          setOrganization(data.organization);
        } else {
          setOrganization(null);
        }
      } catch (error) {
        console.error('Error fetching organization:', error);
        setOrganization(null);
      } finally {
        setLoading(false);
      }
    }

    getOrganization();
  }, []);

  return { organization, loading };
}
