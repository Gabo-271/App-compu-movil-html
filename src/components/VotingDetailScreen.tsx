import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { useVoteApp, getCategoryColor } from './VoteAppContext';
import { ArrowLeft, Calendar, Users, CheckCircle2, AlertCircle, Building2, Hammer, Bus, GraduationCap, Heart, Briefcase } from 'lucide-react';

const getCategoryIcon = (category: string) => {
  const icons: { [key: string]: any } = {
    'Gobierno': Building2,
    'Desarrollo': Hammer,
    'Transporte': Bus,
    'Educación': GraduationCap,
    'Salud': Heart,
    'Economía': Briefcase
  };
  return icons[category] || Building2;
};

export function VotingDetailScreen() {
  const { state, navigateTo, submitVote, showSuccess } = useVoteApp();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  const vote = state.selectedVote;
  if (!vote) return null;

  const totalVotes = vote.options.reduce((total, option) => total + option.votes, 0);
  const isActive = vote.status === 'active';
  const userHasVoted = vote.userVotes && Array.isArray(vote.userVotes) && vote.userVotes.length > 0;

  const handleVoteSubmit = async () => {
    console.log('🖱️ [VOTE_DETAIL] Iniciando proceso de votación...');
    console.log('🎯 [VOTE_DETAIL] selectedOption:', selectedOption);
    console.log('📊 [VOTE_DETAIL] vote completo:', vote);
    console.log('🆔 [VOTE_DETAIL] vote.id (token):', vote.id);
    console.log('👤 [VOTE_DETAIL] userHasVoted:', userHasVoted);
    console.log('✅ [VOTE_DETAIL] Verificando condiciones...');
    
    if (selectedOption && !userHasVoted) {
      try {
        console.log('🖱️ [VOTE_DETAIL] Todas las condiciones pasaron, procediendo...');
        
        setHasVoted(true);
        console.log('⏳ [VOTE_DETAIL] Llamando submitVote con parámetros:');
        console.log('  - voteId (token):', vote.id);
        console.log('  - optionId (selection):', selectedOption);
        
        await submitVote(vote.id, selectedOption);
        
        console.log('✅ [VOTE_DETAIL] submitVote completado, mostrando success');
        showSuccess();
      } catch (error) {
        console.error('❌ [VOTE_DETAIL] Error al enviar voto:', error);
        setHasVoted(false);
        
        // Mostrar error visual al usuario
        alert(`Error al votar: ${error.message || 'Error desconocido'}`);
      }
    } else {
      console.warn('⚠️ [VOTE_DETAIL] No se puede votar, verificando razones:');
      console.warn('  - selectedOption existe:', !!selectedOption);
      console.warn('  - selectedOption valor:', selectedOption);
      console.warn('  - userHasVoted:', userHasVoted);
      console.warn('  - Puede votar:', selectedOption && !userHasVoted);
      
      if (!selectedOption) {
        alert('Por favor selecciona una opción antes de votar');
      } else if (userHasVoted) {
        alert('Ya has votado en esta encuesta');
      }
    }
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getPercentage = (optionVotes: number) => {
    return totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateTo('voting-list')}
            className="w-8 h-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="flex-1 bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent dark:from-slate-200 dark:to-slate-100">
            Detalle de Votación
          </h1>
          <Badge 
            variant={isActive ? 'default' : 'secondary'}
            className={isActive 
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700' 
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}
          >
            {isActive ? 'Activa' : 'Cerrada'}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Title and Info */}
        <Card className="border-l-4 border-l-blue-400 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div>
              <h2 className="leading-tight">{vote.title}</h2>
              <div className="mt-3">
                {(() => {
                  const colors = getCategoryColor(vote.category);
                  const Icon = getCategoryIcon(vote.category);
                  return (
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${colors.bg} ${colors.text} ${colors.border} border`}>
                      <Icon className="w-4 h-4" />
                      <span>{vote.category}</span>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-blue-900 dark:text-blue-100">Inicio</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">{formatDate(vote.startDate)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-purple-900 dark:text-purple-100">Cierre</p>
                  <p className="text-sm text-purple-700 dark:text-purple-300">{formatDate(vote.endDate)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                <div className="w-8 h-8 bg-teal-100 dark:bg-teal-800 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <p className="text-sm text-teal-900 dark:text-teal-100">Participación</p>
                  <p className="text-sm text-teal-700 dark:text-teal-300">{totalVotes} votos emitidos</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card className="bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-800 dark:to-blue-900/10 border border-slate-200/60 dark:border-slate-700">
          <CardContent className="p-6">
            <h3 className="mb-3 text-slate-800 dark:text-slate-200">Descripción</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {vote.description}
            </p>
          </CardContent>
        </Card>

        {/* Voting Options */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3>Opciones de Votación</h3>
            
            {!isActive && (
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <AlertCircle className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Esta votación ya ha cerrado
                </span>
              </div>
            )}

            {userHasVoted && isActive && (
              <div className="flex items-center gap-2 p-3 bg-secondary/10 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-secondary" />
                <span className="text-sm text-secondary">
                  Ya has emitido tu voto en esta votación
                </span>
              </div>
            )}

            <div className="space-y-3">
              {vote.options.map((option) => {
                const percentage = getPercentage(option.votes);
                const isSelected = selectedOption === option.id;
                const isUserVote = Array.isArray(vote.userVotes) && vote.userVotes.includes(option.id);
                
                return (
                  <div key={option.id} className="space-y-2">
                    <button
                      onClick={() => {
                        if (isActive && !userHasVoted) {
                          setSelectedOption(option.id);
                        }
                      }}
                      disabled={!isActive || userHasVoted}
                      className={`w-full p-4 rounded-lg border transition-all text-left ${
                        isSelected && !userHasVoted
                          ? 'border-primary bg-primary/5'
                          : isUserVote
                          ? 'border-secondary bg-secondary/5'
                          : 'border-border bg-card hover:bg-muted/50'
                      } ${
                        !isActive || userHasVoted ? 'cursor-default' : 'cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`${isUserVote ? 'text-secondary' : ''}`}>
                          {option.text}
                        </span>
                        {isSelected && !userHasVoted && (
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        )}
                        {isUserVote && (
                          <CheckCircle2 className="w-5 h-5 text-secondary" />
                        )}
                      </div>
                    </button>
                    
                    {/* Results */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {option.votes} votos
                        </span>
                        <span className="text-muted-foreground">
                          {percentage}%
                        </span>
                      </div>
                      <Progress 
                        value={percentage} 
                        className="h-2"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom spacing */}
      <div className="h-20" />

      {/* Floating Action Button */}
      {isActive && !userHasVoted && (
        <div className="fixed bottom-6 right-6">
          <Button
            onClick={handleVoteSubmit}
            disabled={!selectedOption}
            className="h-14 px-6 rounded-full shadow-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-0 shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 disabled:opacity-50"
            size="lg"
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Emitir Voto
          </Button>
        </div>
      )}
    </div>
  );
}