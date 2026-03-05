import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { JsonLd, useSchemaGenerators } from './JsonLd';

export interface BreadcrumbItem {
  name: string;
  href: string;
  current?: boolean;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
  homeLabel?: string;
}

/**
 * Composant Breadcrumb universel avec Schema.org BreadcrumbList
 * Rendu visuel accessible + données structurées automatiques
 */
export function Breadcrumb({
  items,
  className = '',
  showHome = true,
  homeLabel = 'Accueil'
}: BreadcrumbProps) {
  const { generateBreadcrumbList } = useSchemaGenerators();

  // Préparer les éléments avec accueil optionnel
  const breadcrumbItems = showHome
    ? [{ name: homeLabel, href: '/' }, ...items]
    : items;

  // Générer le schema BreadcrumbList
  const breadcrumbSchema = generateBreadcrumbList(
    breadcrumbItems.map(item => ({
      name: item.name,
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://ultron-murex.vercel.app'}${item.href}`
    }))
  );

  return (
    <>
      <JsonLd data={breadcrumbSchema} id="breadcrumb-schema" />

      <nav
        aria-label="Fil d'Ariane"
        className={`flex items-center space-x-2 text-sm ${className}`}
        role="navigation"
      >
        <ol className="flex items-center space-x-2 list-none m-0 p-0">
          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;
            const isHome = index === 0 && showHome;

            return (
              <li key={item.href} className="flex items-center">
                {index > 0 && (
                  <ChevronRight
                    className="w-4 h-4 text-gray-400 mx-2"
                    aria-hidden="true"
                  />
                )}

                {isLast ? (
                  <span
                    className="text-gray-900 font-medium dark:text-gray-100"
                    aria-current="page"
                  >
                    {isHome ? (
                      <span className="flex items-center">
                        <Home className="w-4 h-4 mr-1" aria-hidden="true" />
                        {item.name}
                      </span>
                    ) : (
                      item.name
                    )}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
                  >
                    {isHome ? (
                      <span className="flex items-center">
                        <Home className="w-4 h-4 mr-1" aria-hidden="true" />
                        {item.name}
                      </span>
                    ) : (
                      item.name
                    )}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}

/**
 * Breadcrumb spécialisé pour les fonctionnalités
 */
export function FeatureBreadcrumb({ feature }: { feature: string }) {
  const items: BreadcrumbItem[] = [
    { name: 'Fonctionnalités', href: '/features' },
    { name: feature, href: `/features/${feature.toLowerCase().replace(/\s+/g, '-')}`, current: true }
  ];

  return <Breadcrumb items={items} />;
}

/**
 * Breadcrumb spécialisé pour le blog
 */
export function BlogBreadcrumb({ article }: { article?: string }) {
  const items: BreadcrumbItem[] = [
    { name: 'Blog', href: '/blog' }
  ];

  if (article) {
    items.push({ name: article, href: '', current: true });
  }

  return <Breadcrumb items={items} />;
}

/**
 * Breadcrumb spécialisé pour les pages CGP
 */
export function CGPBreadcrumb({ page, title }: { page: string; title: string }) {
  const items: BreadcrumbItem[] = [
    { name: 'CGP', href: '/cgp' },
    { name: title, href: `/cgp/${page}`, current: true }
  ];

  return <Breadcrumb items={items} />;
}