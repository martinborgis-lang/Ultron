'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Calculator, Euro, TrendingUp, CheckCircle, Percent } from 'lucide-react';
import type { Product } from '@/types/products';
import { CommissionService, type CommissionCalculation, type SaleData } from '@/lib/services/commission-service';

interface SaleClosureFormProps {
  prospectId: string;
  prospectName: string;
  onSaleClosed: () => void;
}

interface SaleForm {
  productId: string;
  versementInitial: string;
  versementMensuel: string;
  fraisTaux: string;
  fraisSur: 'initial' | 'periodique' | 'les_deux' | null;
}

export function SaleClosureForm({ prospectId, prospectName, onSaleClosed }: SaleClosureFormProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [calculationLoading, setCalculationLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const [saleForm, setSaleForm] = useState<SaleForm>({
    productId: '',
    versementInitial: '',
    versementMensuel: '',
    fraisTaux: '',
    fraisSur: null
  });

  const [commissionPreview, setCommissionPreview] = useState<CommissionCalculation | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  // Recalcul automatique des commissions quand les champs changent
  useEffect(() => {
    if (saleForm.productId && saleForm.versementInitial && saleForm.versementMensuel) {
      calculateCommissions();
    } else {
      setCommissionPreview(null);
    }
  }, [saleForm]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products?.filter((p: Product) => p.is_active && p.type === 'commission') || []);
      }
    } catch (error) {
      console.error('Erreur récupération produits:', error);
      toast.error('Erreur lors du chargement des produits');
    }
  };

  const calculateCommissions = async () => {
    if (!saleForm.productId || !saleForm.versementInitial || !saleForm.versementMensuel) return;

    setCalculationLoading(true);
    try {
      const saleData: SaleData = {
        productId: saleForm.productId,
        versementInitial: parseFloat(saleForm.versementInitial),
        versementMensuel: parseFloat(saleForm.versementMensuel),
        fraisTaux: saleForm.fraisTaux ? parseFloat(saleForm.fraisTaux) / 100 : 0,
        fraisSur: saleForm.fraisSur
      };

      const calculation = await CommissionService.calculateCommissions(saleData);
      setCommissionPreview(calculation);
    } catch (error) {
      console.error('Erreur calcul commissions:', error);
      setCommissionPreview(null);
    } finally {
      setCalculationLoading(false);
    }
  };

  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.id === productId);
    setSelectedProduct(product || null);
    setSaleForm(prev => ({ ...prev, productId }));
  };

  const handleSaveSale = async () => {
    if (!commissionPreview) {
      toast.error('Impossible de calculer les commissions');
      return;
    }

    setLoading(true);
    try {
      const saleData: SaleData = {
        productId: saleForm.productId,
        versementInitial: parseFloat(saleForm.versementInitial),
        versementMensuel: parseFloat(saleForm.versementMensuel),
        fraisTaux: saleForm.fraisTaux ? parseFloat(saleForm.fraisTaux) / 100 : 0,
        fraisSur: saleForm.fraisSur
      };

      const result = await CommissionService.recordSale(prospectId, saleData);

      toast.success('Vente enregistrée avec succès!', {
        description: `CA généré: ${commissionPreview.totalEntreprise}€`
      });

      setShowDialog(false);
      resetForm();
      onSaleClosed();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'enregistrement de la vente');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSaleForm({
      productId: '',
      versementInitial: '',
      versementMensuel: '',
      fraisTaux: '',
      fraisSur: null
    });
    setCommissionPreview(null);
    setSelectedProduct(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button variant="default" className="bg-green-600 hover:bg-green-700">
          <CheckCircle className="h-4 w-4 mr-2" />
          Clôturer la Vente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Clôture de Vente - {prospectName}
          </DialogTitle>
          <DialogDescription>
            Enregistrez les détails de la vente et calculez automatiquement les commissions
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulaire de saisie */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Détails de la Vente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Produit vendu</Label>
                  <Select value={saleForm.productId} onValueChange={handleProductSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un produit" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Versement initial (€)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={saleForm.versementInitial}
                    onChange={(e) => setSaleForm(prev => ({ ...prev, versementInitial: e.target.value }))}
                    placeholder="10000"
                  />
                </div>

                <div>
                  <Label>Versement mensuel (€)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={saleForm.versementMensuel}
                    onChange={(e) => setSaleForm(prev => ({ ...prev, versementMensuel: e.target.value }))}
                    placeholder="500"
                  />
                </div>

                <Separator />

                <div>
                  <Label>Frais conseiller (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={saleForm.fraisTaux}
                    onChange={(e) => setSaleForm(prev => ({ ...prev, fraisTaux: e.target.value }))}
                    placeholder="0.5"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Frais appliqués par le conseiller (optionnel)
                  </p>
                </div>

                {saleForm.fraisTaux && parseFloat(saleForm.fraisTaux) > 0 && (
                  <div>
                    <Label>Frais appliqués sur</Label>
                    <Select
                      value={saleForm.fraisSur || ''}
                      onValueChange={(value: 'initial' | 'periodique' | 'les_deux') => setSaleForm(prev => ({ ...prev, fraisSur: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="initial">Versement initial seulement</SelectItem>
                        <SelectItem value="periodique">Versements mensuels seulement</SelectItem>
                        <SelectItem value="les_deux">Les deux</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Aperçu des commissions */}
          <div className="space-y-4">
            {selectedProduct && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Configuration Produit</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium">{selectedProduct.name}</h4>
                      {selectedProduct.description && (
                        <p className="text-sm text-muted-foreground">{selectedProduct.description}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Badge variant="outline" className="mb-2">Conseiller</Badge>
                        <div>Initial: {selectedProduct.commission_conseiller_initial || 0}%</div>
                        <div>Périodique: {selectedProduct.commission_conseiller_periodique || 0}%</div>
                      </div>
                      <div>
                        <Badge variant="outline" className="mb-2">Cabinet</Badge>
                        <div>Initial: {selectedProduct.commission_cabinet_initial || 0}%</div>
                        <div>Périodique: {selectedProduct.commission_cabinet_periodique || 0}%</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {commissionPreview && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Calcul des Commissions
                    {calculationLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Résumé des montants */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Versement initial</div>
                        <div className="font-medium">{formatCurrency(parseFloat(saleForm.versementInitial) || 0)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Versements année 1</div>
                        <div className="font-medium">{formatCurrency((parseFloat(saleForm.versementMensuel) || 0) * 12)}</div>
                      </div>
                    </div>

                    {commissionPreview.fraisAppliques > 0 && (
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <div className="text-sm">
                          <div className="text-orange-800 font-medium">Frais déduits: {formatCurrency(commissionPreview.fraisAppliques)}</div>
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Détail des commissions */}
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">Commission Conseiller</h4>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span>Initial:</span>
                            <span className="font-medium">{formatCurrency(commissionPreview.conseillerInitial)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Périodique:</span>
                            <span className="font-medium">{formatCurrency(commissionPreview.conseillerPeriodique)}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-medium">
                            <span>Total Conseiller:</span>
                            <span>{formatCurrency(commissionPreview.totalConseiller)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-green-50 rounded-lg">
                        <h4 className="font-medium text-green-800 mb-2">Commission Cabinet</h4>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span>Initial:</span>
                            <span className="font-medium">{formatCurrency(commissionPreview.cabinetInitial)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Périodique:</span>
                            <span className="font-medium">{formatCurrency(commissionPreview.cabinetPeriodique)}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-medium">
                            <span>Total Cabinet:</span>
                            <span>{formatCurrency(commissionPreview.totalCabinet)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200">
                        <div className="flex justify-between items-center">
                          <div className="text-purple-800 font-medium">CA Total Entreprise</div>
                          <div className="text-xl font-bold text-purple-800">
                            {formatCurrency(commissionPreview.totalEntreprise)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { setShowDialog(false); resetForm(); }}>
            Annuler
          </Button>
          <Button
            onClick={handleSaveSale}
            disabled={!commissionPreview || loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Enregistrement...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmer la Vente
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}