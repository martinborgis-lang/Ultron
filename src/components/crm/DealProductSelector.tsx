'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Euro, Percent, Calculator, TrendingUp } from 'lucide-react';
import type { Product, DealProductForm } from '@/types/products';

interface DealProductSelectorProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (dealData: DealProductForm) => void;
  prospectId: string;
  prospectName: string;
}

export function DealProductSelector({
  open,
  onClose,
  onConfirm,
  prospectId,
  prospectName
}: DealProductSelectorProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<DealProductForm>({
    product_id: '',
    client_amount: 0,
    notes: ''
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [calculatedRevenue, setCalculatedRevenue] = useState(0);

  useEffect(() => {
    if (open) {
      fetchProducts();
      resetForm();
    }
  }, [open]);

  useEffect(() => {
    calculateRevenue();
  }, [selectedProduct, formData.client_amount]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products.filter((p: Product) => p.is_active));
      }
    } catch (error) {
      console.error('Erreur récupération produits:', error);
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  const calculateRevenue = () => {
    if (!selectedProduct || !formData.client_amount) {
      setCalculatedRevenue(0);
      return;
    }

    let revenue = 0;
    if (selectedProduct.type === 'fixed') {
      revenue = selectedProduct.fixed_value || 0;
    } else {
      revenue = formData.client_amount * ((selectedProduct.commission_rate || 0) / 100);
    }

    setCalculatedRevenue(revenue);
  };

  const resetForm = () => {
    setFormData({
      product_id: '',
      client_amount: 0,
      notes: ''
    });
    setSelectedProduct(null);
    setCalculatedRevenue(0);
  };

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId);
    setSelectedProduct(product || null);
    setFormData({
      ...formData,
      product_id: productId
    });
  };

  const handleSubmit = () => {
    if (!formData.product_id) {
      toast.error('Veuillez sélectionner un produit');
      return;
    }

    if (selectedProduct?.type === 'commission' && (!formData.client_amount || formData.client_amount <= 0)) {
      toast.error('Veuillez saisir le montant client');
      return;
    }

    // Pour les produits fixes, le montant client est égal au bénéfice
    const finalData = {
      ...formData,
      client_amount: selectedProduct?.type === 'fixed'
        ? (selectedProduct.fixed_value || 0)
        : formData.client_amount
    };

    onConfirm(finalData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Deal Gagné - Configuration du Produit
          </DialogTitle>
          <DialogDescription>
            Prospect : <strong>{prospectName}</strong><br />
            Sélectionnez le produit vendu pour calculer automatiquement le CA et les commissions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sélection du produit */}
          <div>
            <Label>Produit vendu</Label>
            <Select
              value={formData.product_id}
              onValueChange={handleProductChange}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez le produit vendu" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    <div className="flex items-center gap-2">
                      <span>{product.name}</span>
                      <Badge variant={product.type === 'fixed' ? 'default' : 'outline'} className="text-xs">
                        {product.type === 'fixed' ? 'Fixe' : 'Commission'}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Détail du produit sélectionné */}
          {selectedProduct && (
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  {selectedProduct.type === 'fixed' ? (
                    <Euro className="h-5 w-5 text-green-600" />
                  ) : (
                    <Percent className="h-5 w-5 text-blue-600" />
                  )}
                  {selectedProduct.name}
                </CardTitle>
                <CardDescription>{selectedProduct.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedProduct.type === 'fixed' ? (
                    <div className="flex items-center justify-between p-3 bg-green-50/50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                      <span className="text-sm font-medium">Bénéfice fixe :</span>
                      <span className="text-lg font-bold text-green-700 dark:text-green-300">
                        {new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: 'EUR',
                          minimumFractionDigits: 0
                        }).format(selectedProduct.fixed_value || 0)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                      <span className="text-sm font-medium">Taux de commission :</span>
                      <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                        {selectedProduct.commission_rate}%
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Montant client (pour produits à commission) */}
          {selectedProduct?.type === 'commission' && (
            <div>
              <Label>Montant client (€)</Label>
              <Input
                type="number"
                value={formData.client_amount || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  client_amount: parseFloat(e.target.value) || 0
                })}
                placeholder="100000"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Montant total du placement/investissement du client
              </p>
            </div>
          )}

          {/* Calcul automatique du CA */}
          {calculatedRevenue > 0 && (
            <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-yellow-600" />
                  Calcul Automatique
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedProduct?.type === 'commission' && (
                    <div className="flex justify-between text-sm">
                      <span>Montant client :</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: 'EUR',
                          minimumFractionDigits: 0
                        }).format(formData.client_amount)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span>
                      {selectedProduct?.type === 'fixed' ? 'Bénéfice' : 'Commission'} :
                    </span>
                    <span className="font-medium">
                      {selectedProduct?.type === 'fixed'
                        ? `${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(selectedProduct.fixed_value || 0)}`
                        : `${formData.client_amount.toLocaleString('fr-FR')} € × ${selectedProduct?.commission_rate}%`
                      }
                    </span>
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">CA Entreprise :</span>
                      <span className="text-xl font-bold text-green-600 dark:text-green-400">
                        {new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: 'EUR',
                          minimumFractionDigits: 0
                        }).format(calculatedRevenue)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <div>
            <Label>Notes (optionnel)</Label>
            <Textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Détails sur la vente, spécificités du contrat..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.product_id || (selectedProduct?.type === 'commission' && !formData.client_amount)}
            className="bg-green-600 hover:bg-green-700"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Valider le Deal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}