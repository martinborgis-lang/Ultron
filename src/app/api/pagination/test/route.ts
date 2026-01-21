import { NextRequest, NextResponse } from 'next/server';
import PaginationHelper from '@/lib/pagination/pagination-helper';

export const dynamic = 'force-dynamic';

// Route de test pour démontrer le système de pagination
export async function GET(request: NextRequest) {
  try {
    // Générer des données de test
    const totalItems = 1000; // Simuler 1000 éléments
    const testData = Array.from({ length: totalItems }, (_, index) => ({
      id: index + 1,
      name: `Element ${index + 1}`,
      description: `Description pour l'élément numéro ${index + 1}`,
      category: ['A', 'B', 'C'][index % 3],
      score: Math.floor(Math.random() * 100),
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }));

    // ✅ PAGINATION : Parse des paramètres
    const paginationParams = PaginationHelper.parseParams(request.nextUrl.searchParams);

    // Filtres optionnels pour le test
    const categoryFilter = request.nextUrl.searchParams.get('category');
    const searchFilter = request.nextUrl.searchParams.get('search');

    // Appliquer les filtres
    let filteredData = testData;

    if (categoryFilter) {
      filteredData = filteredData.filter(item => item.category === categoryFilter);
    }

    if (searchFilter) {
      filteredData = filteredData.filter(item =>
        item.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        item.description.toLowerCase().includes(searchFilter.toLowerCase())
      );
    }

    // Appliquer le tri
    if (paginationParams.sort) {
      const sortField = paginationParams.sort as keyof typeof filteredData[0];
      filteredData.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue);
          return paginationParams.order === 'asc' ? comparison : -comparison;
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          const comparison = aValue - bValue;
          return paginationParams.order === 'asc' ? comparison : -comparison;
        }

        return 0;
      });
    }

    // ✅ PAGINATION : Appliquer la pagination en mémoire
    const paginatedResult = PaginationHelper.paginateInMemory(filteredData, paginationParams);

    // Ajouter des métadonnées supplémentaires pour le test
    return NextResponse.json({
      ...paginatedResult,
      meta: {
        ...paginatedResult.pagination,
        filters: {
          category: categoryFilter,
          search: searchFilter
        },
        sort: {
          field: paginationParams.sort,
          order: paginationParams.order
        },
        test_info: {
          total_items_generated: totalItems,
          items_after_filtering: filteredData.length,
          pagination_applied: true,
          demonstration: "Ceci est un exemple de pagination standardisée"
        }
      },
      // Ajouter des liens de navigation
      links: PaginationHelper.generateLinks(
        '/api/pagination/test',
        paginatedResult.pagination,
        {
          ...(categoryFilter && { category: categoryFilter }),
          ...(searchFilter && { search: searchFilter }),
          sort: paginationParams.sort || 'created_at',
          order: paginationParams.order || 'desc'
        }
      ),
      examples: {
        basic_pagination: '/api/pagination/test?page=2&limit=10',
        with_filters: '/api/pagination/test?category=A&search=element&page=1&limit=20',
        with_sorting: '/api/pagination/test?sort=score&order=desc&page=1&limit=50',
        all_params: '/api/pagination/test?category=B&search=5&sort=name&order=asc&page=2&limit=25'
      }
    });

  } catch (error) {
    console.error('Error in pagination test:', error);
    return NextResponse.json({
      error: 'Erreur lors du test de pagination',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST pour tester la pagination avec des données custom
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testData = [], customFilters = {} } = body;

    if (!Array.isArray(testData) || testData.length === 0) {
      return NextResponse.json({
        error: 'Veuillez fournir un tableau testData non vide',
        example: {
          testData: [
            { id: 1, name: 'Item 1', category: 'A' },
            { id: 2, name: 'Item 2', category: 'B' }
          ],
          customFilters: { category: 'A' }
        }
      }, { status: 400 });
    }

    // Parse pagination params
    const paginationParams = PaginationHelper.parseParams(request.nextUrl.searchParams);

    // Appliquer les filtres custom
    let filteredData = testData;
    Object.entries(customFilters).forEach(([key, value]) => {
      if (value) {
        filteredData = filteredData.filter(item =>
          item[key] && item[key].toString().toLowerCase().includes(value.toString().toLowerCase())
        );
      }
    });

    // Pagination
    const paginatedResult = PaginationHelper.paginateInMemory(filteredData, paginationParams);

    return NextResponse.json({
      ...paginatedResult,
      meta: {
        ...paginatedResult.pagination,
        original_count: testData.length,
        filtered_count: filteredData.length,
        custom_filters: customFilters,
        message: "Pagination appliquée aux données fournies"
      }
    });

  } catch (error) {
    console.error('Error in POST pagination test:', error);
    return NextResponse.json({
      error: 'Erreur lors du traitement des données',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Documentation de l'API
export async function OPTIONS() {
  return NextResponse.json({
    title: "API de Test - Pagination Standardisée",
    description: "Démontre l'utilisation du système de pagination unifié",
    endpoints: {
      "GET /api/pagination/test": {
        description: "Test avec données générées automatiquement",
        parameters: {
          page: "Numéro de page (défaut: 1)",
          limit: "Éléments par page (défaut: 20, max: 100)",
          sort: "Champ de tri (id, name, score, created_at, etc.)",
          order: "Ordre de tri (asc ou desc, défaut: desc)",
          category: "Filtre par catégorie (A, B, ou C)",
          search: "Recherche textuelle dans name et description"
        },
        examples: [
          "/api/pagination/test",
          "/api/pagination/test?page=2&limit=10",
          "/api/pagination/test?category=A&sort=score&order=desc",
          "/api/pagination/test?search=element&page=1&limit=25"
        ]
      },
      "POST /api/pagination/test": {
        description: "Test avec données personnalisées",
        body: {
          testData: "Tableau d'objets à paginer",
          customFilters: "Filtres à appliquer (optionnel)"
        },
        example: {
          testData: [
            { id: 1, name: "Produit A", category: "electronics", price: 100 },
            { id: 2, name: "Produit B", category: "books", price: 25 }
          ],
          customFilters: { category: "electronics" }
        }
      }
    },
    response_format: {
      data: "Tableau des éléments de la page courante",
      pagination: {
        total: "Nombre total d'éléments",
        page: "Page courante",
        limit: "Éléments par page",
        totalPages: "Nombre total de pages",
        hasNextPage: "Boolean - page suivante disponible",
        hasPrevPage: "Boolean - page précédente disponible",
        nextPage: "Numéro de la page suivante (si disponible)",
        prevPage: "Numéro de la page précédente (si disponible)",
        offset: "Offset courant"
      },
      meta: "Métadonnées additionnelles",
      links: "Liens de navigation (optionnel)"
    }
  });
}