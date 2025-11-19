import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { X, Plus } from 'lucide-react';
import { useVoteApp } from './VoteAppContext';

interface PollOption {
  choice: string;
}

export function CreatePollDialog({ onClose }: { onClose: () => void }) {
  const { createNewPoll, setError } = useVoteApp();
  const [pollName, setPollName] = useState('');
  const [options, setOptions] = useState<PollOption[]>([
    { choice: '' },
    { choice: '' }
  ]);
  const [isCreating, setIsCreating] = useState(false);

  const addOption = () => {
    if (options.length < 10) { // Límite máximo de opciones
      setOptions([...options, { choice: '' }]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) { // Mínimo 2 opciones
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, choice: string) => {
    setOptions(options.map((opt, i) => i === index ? { choice } : opt));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pollName.trim()) {
      setError('El nombre de la encuesta es requerido');
      return;
    }

    const validOptions = options.filter(opt => opt.choice.trim());
    if (validOptions.length < 2) {
      setError('La encuesta debe tener al menos 2 opciones válidas');
      return;
    }

    try {
      setIsCreating(true);
      await createNewPoll({
        name: pollName.trim(),
        options: validOptions
      });
      onClose();
    } catch (error: any) {
      console.error('Error creando encuesta:', error);
      // El error ya se maneja en el contexto
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Crear Nueva Encuesta</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={isCreating}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="poll-name">Nombre de la Encuesta</Label>
              <Input
                id="poll-name"
                value={pollName}
                onChange={(e) => setPollName(e.target.value)}
                placeholder="Ej: ¿Cuál es tu preferencia?"
                disabled={isCreating}
              />
            </div>

            <div className="space-y-2">
              <Label>Opciones de Respuesta</Label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option.choice}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Opción ${index + 1}`}
                      disabled={isCreating}
                    />
                    {options.length > 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeOption(index)}
                        disabled={isCreating}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              {options.length < 10 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  disabled={isCreating}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Opción
                </Button>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isCreating}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isCreating || !pollName.trim()}
                className="flex-1"
              >
                {isCreating ? 'Creando...' : 'Crear Encuesta'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}