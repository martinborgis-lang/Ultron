'use client';

import { useState } from 'react';
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
} from '@/components/ui/sheet';
import { Users, Plus, Mail, Shield, UserCog } from 'lucide-react';

const mockTeam = [
  { id: '1', name: 'Jean Dupont', email: 'jean@cabinet.fr', role: 'admin', isActive: true },
  { id: '2', name: 'Marie Martin', email: 'marie@cabinet.fr', role: 'conseiller', isActive: true },
  { id: '3', name: 'Pierre Bernard', email: 'pierre@cabinet.fr', role: 'conseiller', isActive: true },
];

export function TeamManager() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50">
              <Users className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Equipe</CardTitle>
              <CardDescription>
                Gerez les membres de votre equipe
              </CardDescription>
            </div>
          </div>

          <Sheet>
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
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                  <Mail className="mr-2 h-4 w-4" />
                  Envoyer l'invitation
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mockTeam.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-white hover:bg-zinc-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-indigo-100 text-indigo-600">
                    {member.name.split(' ').map((n) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-zinc-900">{member.name}</p>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant="secondary"
                  className={
                    member.role === 'admin'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-zinc-100 text-zinc-700'
                  }
                >
                  {member.role === 'admin' ? (
                    <Shield className="mr-1 h-3 w-3" />
                  ) : (
                    <UserCog className="mr-1 h-3 w-3" />
                  )}
                  {member.role === 'admin' ? 'Admin' : 'Conseiller'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
