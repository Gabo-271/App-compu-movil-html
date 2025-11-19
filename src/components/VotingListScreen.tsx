import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { useVoteApp, getCategoryColor } from './VoteAppContext';
import { CreatePollDialog } from './CreatePollDialog';
import { PollResultsDialog } from './PollResultsDialog';
import { ApiTestDialog } from './ApiTestDialog';
import { Search, Filter, Calendar, Users, ChevronRight, Moon, Sun, Building2, Hammer, Bus, GraduationCap, Heart, Briefcase, Plus, BarChart3, Settings } from 'lucide-react';

const categories = ['Todos', 'Gobierno', 'Desarrollo', 'Transporte', 'Educación', 'Salud', 'Economía'];

const getCategoryIcon = (category: string) => {
  const icons: { [key: string]: any } = {
    'Todos': Search,
    'Gobierno': Building2,
    'Desarrollo': Hammer,
    'Transporte': Bus,
    'Educación': GraduationCap,
    'Salud': Heart,
    'Economía': Briefcase
  };
  return icons[category] || icons['Todos'];
};

export function VotingListScreen() {
  const { 
    state, 
    navigateTo, 
    logout, 
    setSearchQuery, 
    setSelectedCategory, 
    toggleDarkMode 
  } = useVoteApp();
  
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedVoteForResults, setSelectedVoteForResults] = useState<any>(null);
  const [showApiTestDialog, setShowApiTestDialog] = useState(false);

  const filteredVotes = state.votes.filter(vote => {
    const matchesSearch = vote.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
                         vote.shortDescription.toLowerCase().includes(state.searchQuery.toLowerCase());
    const matchesCategory = state.selectedCategory === 'Todos' || vote.category === state.selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                <path d="M9 12l2 2 4-4"/>
              </svg>
            </div>
            <div>
              <h1 className="text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                VoteApp
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Crear</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowApiTestDialog(true)}
              className="border-orange-200 text-orange-600 hover:bg-orange-50"
            >
              <Settings className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDarkMode}
              className="w-8 h-8 p-0"
            >
              {state.isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateTo('profile')}
              className="p-0"
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={state.user?.photoUrl} />
                <AvatarFallback>{state.user?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar votaciones..."
              value={state.searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-12 h-10 bg-muted/50"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 w-8 h-8 p-0"
            >
              <Filter className="w-4 h-4" />
            </Button>
          </div>
          
          {/* API Status indicator */}
          {state.dataSource && (
            <div className="mt-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  state.dataSource === 'api' ? 'bg-green-500' : 'bg-orange-500'
                }`} />
                <span className="text-muted-foreground">
                  {state.dataSource === 'api' 
                    ? 'Datos de Sebastian.cl' 
                    : 'Datos de ejemplo (API no disponible)'
                  }
                </span>
              </div>
              {state.dataSource === 'mock' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowApiTestDialog(true)}
                  className="h-auto py-1 px-2 text-xs text-orange-600 hover:bg-orange-50"
                >
                  Configurar API
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="px-4 pb-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((category) => {
                const colors = getCategoryColor(category);
                const Icon = getCategoryIcon(category);
                const isSelected = state.selectedCategory === category;
                
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-full text-sm whitespace-nowrap transition-all duration-200
                      ${isSelected 
                        ? `${colors.bg} ${colors.text} ${colors.border} border shadow-sm` 
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted border border-transparent'
                      }
                    `}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{category}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {filteredVotes.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3>No se encontraron votaciones</h3>
            <p className="text-muted-foreground mt-2">
              Intenta con otros términos de búsqueda
            </p>
          </div>
        ) : (
          filteredVotes.map((vote) => {
            const colors = getCategoryColor(vote.category);
            const Icon = getCategoryIcon(vote.category);
            
            return (
              <Card 
                key={vote.id} 
                className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4 border-l-transparent hover:border-l-blue-400"
                onClick={() => navigateTo('voting-detail', vote)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="line-clamp-2 leading-snug">{vote.title}</h3>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge 
                            variant={vote.status === 'active' ? 'default' : 'secondary'}
                            className={vote.status === 'active' 
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700' 
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}
                          >
                            {vote.status === 'active' ? 'Activa' : 'Cerrada'}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
                        {vote.shortDescription}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(vote.startDate)} - {formatDate(vote.endDate)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{vote.options.reduce((total, option) => total + option.votes, 0)} votos</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs ${colors.bg} ${colors.text} ${colors.border} border`}>
                          <Icon className="w-3 h-3" />
                          <span>{vote.category}</span>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVoteForResults(vote);
                          }}
                          className="h-7 px-2 text-xs"
                        >
                          <BarChart3 className="w-3 h-3 mr-1" />
                          Resultados
                        </Button>
                      </div>
                    </div>
                    
                    <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Bottom spacing */}
      <div className="h-20" />
      
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="flex justify-around items-center py-2">
          <Button 
            variant="ghost" 
            className="flex-1 flex flex-col items-center gap-1 h-auto py-2"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
              <path d="M9 12l2 2 4-4"/>
            </svg>
            <span className="text-xs text-primary">Votaciones</span>
          </Button>
          
          <Button 
            variant="ghost" 
            className="flex-1 flex flex-col items-center gap-1 h-auto py-2"
            onClick={() => navigateTo('profile')}
          >
            <Users className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Perfil</span>
          </Button>
        </div>
      </div>

      {/* Create Poll Dialog */}
      {showCreateDialog && (
        <CreatePollDialog onClose={() => setShowCreateDialog(false)} />
      )}
      
      {/* Poll Results Dialog */}
      {selectedVoteForResults && (
        <PollResultsDialog 
          vote={selectedVoteForResults}
          onClose={() => setSelectedVoteForResults(null)}
        />
      )}
      
      {/* API Test Dialog */}
      {showApiTestDialog && (
        <ApiTestDialog onClose={() => setShowApiTestDialog(false)} />
      )}
    </div>
  );
}