import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { X, Users, Calendar, Trophy } from 'lucide-react';

interface PollResultsDialogProps {
  vote: {
    id: string;
    title: string;
    description: string;
    totalVotes: number;
    options: Array<{
      id: string;
      text: string;
      votes: number;
    }>;
    endDate: Date;
  };
  onClose: () => void;
}

export function PollResultsDialog({ vote, onClose }: PollResultsDialogProps) {
  // Calcular porcentajes
  const optionsWithPercentage = vote.options.map(option => ({
    ...option,
    percentage: vote.totalVotes > 0 ? (option.votes / vote.totalVotes) * 100 : 0
  }));

  // Ordenar por votos (descendente)
  const sortedOptions = [...optionsWithPercentage].sort((a, b) => b.votes - a.votes);
  const winner = sortedOptions[0];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg pr-4">{vote.title}</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Estadísticas generales */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Users className="h-5 w-5 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600">{vote.totalVotes}</div>
              <div className="text-sm text-muted-foreground">Total de votos</div>
            </div>
            
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Calendar className="h-5 w-5 mx-auto mb-2 text-green-600" />
              <div className="text-sm font-medium text-green-600">Finaliza</div>
              <div className="text-xs text-muted-foreground">{formatDate(vote.endDate)}</div>
            </div>
          </div>

          {/* Ganador */}
          {vote.totalVotes > 0 && (
            <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                  Opción más votada
                </span>
              </div>
              <div className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
                {winner.text}
              </div>
              <div className="text-sm text-yellow-600 dark:text-yellow-400">
                {winner.votes} votos ({winner.percentage.toFixed(1)}%)
              </div>
            </div>
          )}

          {/* Resultados detallados */}
          <div className="space-y-3">
            <h3 className="font-medium text-foreground">Resultados detallados</h3>
            
            {vote.totalVotes === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Aún no hay votos registrados</p>
              </div>
            ) : (
              sortedOptions.map((option, index) => (
                <div key={option.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium flex-1 pr-2">
                      {option.text}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {option.votes} ({option.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  
                  <Progress 
                    value={option.percentage} 
                    className="h-2"
                  />
                  
                  {index === 0 && option.percentage > 0 && (
                    <div className="flex items-center gap-1 text-xs text-yellow-600">
                      <Trophy className="h-3 w-3" />
                      <span>Liderando</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Descripción */}
          {vote.description && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">Acerca de esta encuesta</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {vote.description}
              </p>
            </div>
          )}

          {/* Botón de cerrar */}
          <div className="pt-4">
            <Button onClick={onClose} className="w-full">
              Cerrar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}