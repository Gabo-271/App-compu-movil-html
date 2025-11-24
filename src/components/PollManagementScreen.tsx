import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useVoteApp } from './VoteAppContext';
import { ArrowLeft, Plus, Edit2, Trash2, Save, X } from 'lucide-react';

export function PollManagementScreen() {
  const { state, navigateTo, createPoll, updatePoll, deletePoll } = useVoteApp();
  const [isCreating, setIsCreating] = useState(false);
  const [editingPoll, setEditingPoll] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    options: [
      { selection: 1, choice: '' },
      { selection: 2, choice: '' }
    ]
  });

  const resetForm = () => {
    setFormData({
      name: '',
      options: [
        { selection: 1, choice: '' },
        { selection: 2, choice: '' }
      ]
    });
    setIsCreating(false);
    setEditingPoll(null);
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [
        ...prev.options,
        { selection: prev.options.length + 1, choice: '' }
      ]
    }));
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      setFormData(prev => ({
        ...prev,
        options: prev.options
          .filter((_, i) => i !== index)
          .map((option, i) => ({ ...option, selection: i + 1 }))
      }));
    }
  };

  const updateOption = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((option, i) => 
        i === index ? { ...option, choice: value } : option
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Por favor ingresa un nombre para la encuesta');
      return;
    }

    const validOptions = formData.options.filter(opt => opt.choice.trim());
    if (validOptions.length < 2) {
      alert('Por favor proporciona al menos 2 opciones válidas');
      return;
    }

    try {
      if (editingPoll) {
        // Actualizar encuesta existente
        const pollToUpdate = state.votes.find(vote => vote.id === editingPoll);
        if (pollToUpdate) {
          await updatePoll({
            token: pollToUpdate.id,
            name: formData.name,
            active: true,
            options: validOptions
          });
        }
      } else {
        // Crear nueva encuesta
        await createPoll({
          name: formData.name,
          options: validOptions
        });
      }
      
      resetForm();
      alert(editingPoll ? 'Encuesta actualizada correctamente' : 'Encuesta creada correctamente');
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleEdit = (poll: any) => {
    setFormData({
      name: poll.title,
      options: poll.options.map((opt: any, index: number) => ({
        selection: index + 1,
        choice: opt.text
      }))
    });
    setEditingPoll(poll.id);
    setIsCreating(true);
  };

  const handleDelete = async (pollId: string, pollName: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar la encuesta "${pollName}"?`)) {
      try {
        await deletePoll(pollId);
        alert('Encuesta eliminada correctamente');
      } catch (error) {
        alert(`Error eliminando encuesta: ${error.message}`);
      }
    }
  };

  // Filtrar solo las encuestas del usuario (owner: true sería ideal, pero no tenemos ese campo)
  const userPolls = state.votes; // Por ahora mostrar todas

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
            Gestión de Encuestas
          </h1>
          <Button
            onClick={() => setIsCreating(!isCreating)}
            size="sm"
            className="bg-blue-500 hover:bg-blue-600"
          >
            {isCreating ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Formulario de creación/edición */}
        {isCreating && (
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-blue-700 dark:text-blue-300">
                {editingPoll ? 'Editar Encuesta' : 'Nueva Encuesta'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nombre de la encuesta
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej: ¿Qué opinas sobre...?"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Opciones de respuesta
                  </label>
                  <div className="space-y-2">
                    {formData.options.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="w-8 h-9 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center text-sm">
                          {index + 1}
                        </div>
                        <Input
                          value={option.choice}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder={`Opción ${index + 1}`}
                          required
                        />
                        {formData.options.length > 2 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeOption(index)}
                            className="px-2"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addOption}
                    className="mt-2"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar opción
                  </Button>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="bg-blue-500 hover:bg-blue-600">
                    <Save className="w-4 h-4 mr-2" />
                    {editingPoll ? 'Actualizar' : 'Crear'} Encuesta
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Lista de encuestas */}
        <div>
          <h2 className="text-lg font-semibold mb-4">
            Encuestas Disponibles ({userPolls.length})
          </h2>
          
          {userPolls.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No hay encuestas disponibles</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {userPolls.map((poll) => (
                <Card key={poll.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{poll.title}</h3>
                          <Badge variant={poll.status === 'active' ? 'default' : 'secondary'}>
                            {poll.status === 'active' ? 'Activa' : 'Cerrada'}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {poll.options.length} opciones • {poll.options.reduce((total, opt) => total + opt.votes, 0)} votos totales
                        </p>
                        
                        <div className="text-xs text-muted-foreground">
                          Token: {poll.id}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(poll)}
                          className="px-2"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(poll.id, poll.title)}
                          className="px-2 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}