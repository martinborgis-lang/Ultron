'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  ShoppingCart, Plus, Edit, Trash2, Euro, Percent,
  Users, Settings, Package, TrendingUp
} from 'lucide-react';
import type { Product, AdvisorCommission } from '@/types/products';

interface ProductsManagerProps {
  organizationId: string;
}

interface ProductForm {
  name: string;
  description: string;
  type: 'fixed' | 'commission';
  fixed_value: string;
  commission_rate: string;
  category: string;
}

export function ProductsManager({ organizationId }: ProductsManagerProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [commissions, setCommissions] = useState<AdvisorCommission[]>([]);
  const [advisors, setAdvisors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showProductDialog, setShowProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    type: 'commission' as 'fixed' | 'commission',
    fixed_value: '',
    commission_rate: '',
    category: ''
  });

  const [showCommissionDialog, setShowCommissionDialog] = useState(false);
  const [commissionForm, setCommissionForm] = useState({
    user_id: '',
    product_id: '',
    commission_rate: '',
    is_default: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Récupérer produits, commissions et conseillers en parallèle
      const [productsRes, commissionsRes, advisorsRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/advisor-commissions'),
        fetch('/api/team')
      ]);

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData.products || []);
      }

      if (commissionsRes.ok) {
        const commissionsData = await commissionsRes.json();
        setCommissions(commissionsData.commissions || []);
      }

      if (advisorsRes.ok) {
        const advisorsData = await advisorsRes.json();
        setAdvisors(advisorsData.advisors?.filter((a: any) => a.role === 'conseiller') || []);
      }
    } catch (error) {
      console.error('Erreur récupération données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async () => {
    try {
      const payload = {
        name: productForm.name,
        description: productForm.description,
        type: productForm.type,
        category: productForm.category,
        ...(productForm.type === 'fixed' ? {
          fixed_value: parseFloat(productForm.fixed_value)
        } : {
          commission_rate: parseFloat(productForm.commission_rate)
        })
      };

      const response = editingProduct
        ? await fetch(`/api/products/${editingProduct.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
        : await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const result = await response.json();
      toast.success(result.message);

      setShowProductDialog(false);
      setEditingProduct(null);
      resetProductForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Supprimer le produit "${product.name}" ?`)) return;

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const result = await response.json();
      toast.success(result.message);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  const handleSaveCommission = async () => {
    try {
      const payload = {
        user_id: commissionForm.user_id,
        product_id: commissionForm.product_id === 'all' || !commissionForm.product_id ? null : commissionForm.product_id,
        commission_rate: parseFloat(commissionForm.commission_rate),
        is_default: commissionForm.is_default
      };

      const response = await fetch('/api/advisor-commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const result = await response.json();
      toast.success(result.message);

      setShowCommissionDialog(false);
      resetCommissionForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      description: '',
      type: 'commission',
      fixed_value: '',
      commission_rate: '',
      category: ''
    });
  };

  const resetCommissionForm = () => {
    setCommissionForm({
      user_id: '',
      product_id: '',
      commission_rate: '',
      is_default: false
    });
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || '',
      type: product.type,
      fixed_value: product.fixed_value?.toString() || '',
      commission_rate: product.commission_rate?.toString() || '',
      category: product.category || ''
    });
    setShowProductDialog(true);
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <Tabs defaultValue="products" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="products" className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          Produits
        </TabsTrigger>
        <TabsTrigger value="commissions" className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Commissions
        </TabsTrigger>
      </TabsList>

      <TabsContent value="products" className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Produits Configurés
                </CardTitle>
                <CardDescription>
                  Gérez les produits vendus par votre organisation
                </CardDescription>
              </div>
              <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
                <DialogTrigger asChild>
                  <Button onClick={resetProductForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau Produit
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingProduct ? 'Modifier' : 'Créer'} un Produit
                    </DialogTitle>
                    <DialogDescription>
                      Configurez les détails du produit et son mode de rémunération
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div>
                      <Label>Nom du produit</Label>
                      <Input
                        value={productForm.name}
                        onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                        placeholder="ex: Pompe à chaleur air/eau"
                      />
                    </div>

                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={productForm.description}
                        onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                        placeholder="Description détaillée..."
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label>Catégorie</Label>
                      <Input
                        value={productForm.category || ''}
                        onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                        placeholder="Ex: Assurance Vie, Pompe à Chaleur, Formation..."
                      />
                    </div>

                    <div>
                      <Label>Type de rémunération</Label>
                      <Select
                        value={productForm.type}
                        onValueChange={(value: 'fixed' | 'commission') => setProductForm({...productForm, type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">Bénéfice fixe</SelectItem>
                          <SelectItem value="commission">Commission sur montant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {productForm.type === 'fixed' ? (
                      <div>
                        <Label>Bénéfice fixe (€)</Label>
                        <Input
                          type="number"
                          value={productForm.fixed_value}
                          onChange={(e) => setProductForm({...productForm, fixed_value: e.target.value})}
                          placeholder="15000"
                        />
                      </div>
                    ) : (
                      <div>
                        <Label>Taux de commission (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={productForm.commission_rate}
                          onChange={(e) => setProductForm({...productForm, commission_rate: e.target.value})}
                          placeholder="2.5"
                        />
                      </div>
                    )}
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowProductDialog(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleSaveProduct}>
                      {editingProduct ? 'Modifier' : 'Créer'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {products.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">{product.name}</h4>
                      {product.category && (
                        <Badge variant="secondary">
                          {product.category}
                        </Badge>
                      )}
                      <Badge variant={product.type === 'fixed' ? 'default' : 'outline'}>
                        {product.type === 'fixed' ? (
                          <><Euro className="h-3 w-3 mr-1" />Fixe</>
                        ) : (
                          <><Percent className="h-3 w-3 mr-1" />Commission</>
                        )}
                      </Badge>
                      {!product.is_active && (
                        <Badge variant="destructive">Inactif</Badge>
                      )}
                    </div>
                    {product.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {product.description}
                      </p>
                    )}
                    <div className="text-sm text-muted-foreground mt-2">
                      {product.type === 'fixed' ? (
                        `Bénéfice: ${new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: 'EUR',
                          minimumFractionDigits: 0
                        }).format(product.fixed_value || 0)}`
                      ) : (
                        `Commission: ${product.commission_rate}%`
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditProduct(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteProduct(product)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {products.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun produit configuré. Créez votre premier produit pour commencer.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="commissions" className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Commissions des Conseillers
                </CardTitle>
                <CardDescription>
                  Configurez les taux de commission de chaque conseiller
                </CardDescription>
              </div>
              <Dialog open={showCommissionDialog} onOpenChange={setShowCommissionDialog}>
                <DialogTrigger asChild>
                  <Button onClick={resetCommissionForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Configurer Commission
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Configurer Commission</DialogTitle>
                    <DialogDescription>
                      Définissez le taux de commission pour un conseiller
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div>
                      <Label>Conseiller</Label>
                      <Select
                        value={commissionForm.user_id}
                        onValueChange={(value) => setCommissionForm({...commissionForm, user_id: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un conseiller" />
                        </SelectTrigger>
                        <SelectContent>
                          {advisors.map((advisor) => (
                            <SelectItem key={advisor.id} value={advisor.id}>
                              {advisor.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Produit (optionnel)</Label>
                      <Select
                        value={commissionForm.product_id}
                        onValueChange={(value) => setCommissionForm({...commissionForm, product_id: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Tous les produits (par défaut)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les produits (par défaut)</SelectItem>
                          {products.filter(p => p.is_active).map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Taux de commission (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={commissionForm.commission_rate}
                        onChange={(e) => setCommissionForm({...commissionForm, commission_rate: e.target.value})}
                        placeholder="10.0"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        % du CA généré par le conseiller
                      </p>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCommissionDialog(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleSaveCommission}>
                      Configurer
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {commissions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune commission configurée. Définissez les taux de vos conseillers.
                </div>
              ) : (
                commissions.map((commission) => (
                  <div key={commission.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">{commission.user?.full_name}</h4>
                        <Badge variant={commission.is_default ? 'default' : 'secondary'}>
                          {commission.product ? commission.product.name : 'Par défaut'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {commission.user?.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {commission.commission_rate}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        du CA généré
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}