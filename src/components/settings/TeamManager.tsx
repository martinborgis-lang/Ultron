'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Users, Plus, Mail, Shield, UserCog, Trash2, CheckCircle, XCircle, Loader2, Unlink } from 'lucide-react';

interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'conseiller';
  is_active: boolean;
  gmail_connected: boolean;
  created_at: string;
}

interface TeamManagerProps {
  currentUserId?: string;
}

export function TeamManager({ currentUserId: initialUserId }: TeamManagerProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(initialUserId);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'conseiller'>('conseiller');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current user ID if not provided
  useEffect(() => {
    if (!currentUserId) {
      fetch('/api/user/me')
        .then(res => res.json())
        .then(data => {
          if (data.id) {
            console.log('[TeamManager] Fetched currentUserId:', data.id);
            setCurrentUserId(data.id);
          }
        })
        .catch(err => console.error('[TeamManager] Failed to fetch current user:', err));
    }
  }, [currentUserId]);

  const fetchTeam = useCallback(async () => {
    try {
      console.log('[TeamManager] currentUserId:', currentUserId);
      const response = await fetch('/api/team');
      if (!response.ok) throw new Error('Erreur lors du chargement');
      const data = await response.json();
      console.log('[TeamManager] members:', data.members?.map((m: TeamMember) => ({ id: m.id, email: m.email, gmail_connected: m.gmail_connected })));
      setMembers(data.members || []);
    } catch (err) {
      console.error('Failed to fetch team:', err);
      setError('Impossible de charger l\'equipe');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const handleAddMember = async () => {
    if (!email || !name) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, full_name: name, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'ajout');
      }

      setMembers([...members, data.member]);
      setEmail('');
      setName('');
      setRole('conseiller');
      setSheetOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    try {
      const response = await fetch(`/api/team/${memberId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      setMembers(members.filter(m => m.id !== memberId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  };

  const handleConnectGmail = () => {
    window.location.href = '/api/google/auth?type=gmail';
  };

  const handleDisconnectGmail = async (memberId: string) => {
    try {
      const response = await fetch(`/api/team/${memberId}/gmail`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la deconnexion');
      }

      // Update local state
      setMembers(members.map(m =>
        m.id === memberId ? { ...m, gmail_connected: false } : m
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  };

  // Check if current user has Gmail connected
  const currentMember = members.find(m => m.id === currentUserId);
  const showGmailBanner = currentMember && !currentMember.gmail_connected;

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Chargement de l&apos;equipe...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Gmail Connection Banner */}
      {showGmailBanner && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="font-medium text-amber-900 dark:text-amber-100">
                    Connectez votre Gmail
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Pour envoyer des emails depuis votre adresse personnelle
                  </p>
                </div>
              </div>
              <Button
                onClick={handleConnectGmail}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Mail className="mr-2 h-4 w-4" />
                Connecter Gmail
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Card */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950">
                <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Equipe</CardTitle>
                <CardDescription>
                  Gerez les membres de votre equipe
                </CardDescription>
              </div>
            </div>

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Ajouter un membre</SheetTitle>
                  <SheetDescription>
                    Invitez un nouveau conseiller a rejoindre votre equipe
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-4 mt-6">
                  {error && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-sm">
                      {error}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="memberName">Nom complet</Label>
                    <Input
                      id="memberName"
                      placeholder="Nom du conseiller"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="memberEmail">Email</Label>
                    <Input
                      id="memberEmail"
                      type="email"
                      placeholder="email@exemple.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="memberRole">Role</Label>
                    <Select value={role} onValueChange={(v) => setRole(v as 'admin' | 'conseiller')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="conseiller">Conseiller</SelectItem>
                        <SelectItem value="admin">Administrateur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <SheetClose asChild>
                      <Button variant="outline" className="flex-1">
                        Annuler
                      </Button>
                    </SheetClose>
                    <Button
                      onClick={handleAddMember}
                      disabled={saving || !email || !name}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                    >
                      {saving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="mr-2 h-4 w-4" />
                      )}
                      {saving ? 'Ajout...' : 'Ajouter'}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Aucun membre dans l&apos;equipe
              </p>
            ) : (
              members.map((member) => {
                const isCurrentUser = member.id === currentUserId;
                console.log('[TeamManager] Comparing:', { memberId: member.id, currentUserId, isCurrentUser, gmail_connected: member.gmail_connected });
                return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400">
                        {member.full_name?.split(' ').map((n) => n[0]).join('') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{member.full_name || 'Sans nom'}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Gmail Connect/Disconnect - only current user can manage their own */}
                    {isCurrentUser ? (
                      member.gmail_connected ? (
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Gmail connecte
                          </Badge>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground hover:text-red-600">
                                <Unlink className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Deconnecter Gmail ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Vous ne pourrez plus envoyer d&apos;emails depuis votre adresse Gmail.
                                  Les emails seront envoyes depuis l&apos;adresse de l&apos;organisation.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDisconnectGmail(member.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Deconnecter
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={handleConnectGmail}
                        >
                          <Mail className="mr-1.5 h-3.5 w-3.5" />
                          Connecter Gmail
                        </Button>
                      )
                    ) : (
                      <Badge
                        variant="secondary"
                        className={
                          member.gmail_connected
                            ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                        }
                      >
                        {member.gmail_connected ? (
                          <CheckCircle className="mr-1 h-3 w-3" />
                        ) : (
                          <XCircle className="mr-1 h-3 w-3" />
                        )}
                        Gmail
                      </Badge>
                    )}

                    {/* Role Badge */}
                    <Badge
                      variant="secondary"
                      className={
                        member.role === 'admin'
                          ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }
                    >
                      {member.role === 'admin' ? (
                        <Shield className="mr-1 h-3 w-3" />
                      ) : (
                        <UserCog className="mr-1 h-3 w-3" />
                      )}
                      {member.role === 'admin' ? 'Admin' : 'Conseiller'}
                    </Badge>

                    {/* Delete Button (not for current user) */}
                    {member.id !== currentUserId && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer ce membre ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action est irreversible. {member.full_name || member.email} sera
                              supprime de l&apos;equipe et ne pourra plus acceder a l&apos;application.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteMember(member.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              )})
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
