import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { useVoteApp } from './VoteAppContext';
import { ArrowLeft, Mail, Calendar, Vote, LogOut, CheckCircle2, Clock } from 'lucide-react';

export function UserProfileScreen() {
  const { state, navigateTo, logout } = useVoteApp();

  if (!state.user) return null;

  const userVotedVoteIds = state.userVotes.map(uv => uv.voteId);
  const userVotedVotes = state.votes.filter(vote => userVotedVoteIds.includes(vote.id));
  const activeVotes = state.votes.filter(vote => vote.status === 'active').length;
  const totalVotes = state.votes.length;

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateTo('voting-list')}
            className="w-8 h-8 p-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="flex-1">Mi Perfil</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* User Info */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={state.user.photoUrl} />
                <AvatarFallback className="text-lg">
                  {state.user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h2>{state.user.name}</h2>
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{state.user.email}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl text-primary mb-1">{state.userVotes.length}</div>
              <div className="text-xs text-muted-foreground">Votos Emitidos</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl text-secondary mb-1">{activeVotes}</div>
              <div className="text-xs text-muted-foreground">Votaciones Activas</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl text-foreground mb-1">{totalVotes}</div>
              <div className="text-xs text-muted-foreground">Total Disponibles</div>
            </CardContent>
          </Card>
        </div>

        {/* Voting History */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3>Historial de Votaciones</h3>
            
            {userVotedVotes.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center mb-3">
                  <Vote className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  Aún no has participado en ninguna votación
                </p>
                <Button 
                  variant="outline" 
                  className="mt-3"
                  onClick={() => navigateTo('voting-list')}
                >
                  Ver Votaciones Disponibles
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {userVotedVotes.map((vote) => {
                  const userVote = state.userVotes.find(uv => uv.voteId === vote.id);
                  const selectedOption = vote.options.find(opt => opt.id === userVote?.optionId);
                  
                  return (
                    <div 
                      key={vote.id}
                      className="p-4 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigateTo('voting-detail', vote)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm line-clamp-1">{vote.title}</h4>
                            <Badge 
                              variant={vote.status === 'active' ? 'default' : 'secondary'}
                              className="shrink-0 text-xs"
                            >
                              {vote.status === 'active' ? 'Activa' : 'Cerrada'}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>Votado el {formatDate(userVote?.createdAt || vote.endDate)}</span>
                          </div>
                          
                          {selectedOption && (
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-secondary" />
                              <span className="text-sm text-secondary">
                                {selectedOption.text}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center text-muted-foreground">
                          {vote.status === 'active' ? (
                            <Clock className="w-4 h-4" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3>Configuración</h3>
            
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {}}
              >
                <Mail className="w-4 h-4 mr-2" />
                Notificaciones por Email
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {}}
              >
                <Vote className="w-4 h-4 mr-2" />
                Preferencias de Votación
              </Button>
            </div>
            
            <Separator />
            
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Bottom spacing */}
      <div className="h-20" />
      
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="flex justify-around items-center py-2">
          <Button 
            variant="ghost" 
            className="flex-1 flex flex-col items-center gap-1 h-auto py-2"
            onClick={() => navigateTo('voting-list')}
          >
            <Vote className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Votaciones</span>
          </Button>
          
          <Button 
            variant="ghost" 
            className="flex-1 flex flex-col items-center gap-1 h-auto py-2"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span className="text-xs text-primary">Perfil</span>
          </Button>
        </div>
      </div>
    </div>
  );
}