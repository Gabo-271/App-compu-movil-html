import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, XCircle, Loader2, TestTube, Key, Globe } from 'lucide-react';

interface ApiTestResult {
  step: string;
  success: boolean;
  message: string;
  data?: any;
}

export function ApiTestDialog({ onClose }: { onClose: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ApiTestResult[]>([]);
  const [apiToken, setApiToken] = useState('11ozVwpPIjVPPxB3wNnjI8XSfnl7vhYTxtqfr');
  const [apiKey, setApiKey] = useState('aaa-bbb-ccc-ddd');

  const testSebastianApi = async () => {
    console.log('🧪 [API TEST] =================================');
    console.log('🧪 [API TEST] INICIANDO PRUEBAS DE API');
    console.log('🧪 [API TEST] =================================');
    console.log('📤 [API TEST] X-API-TOKEN:', apiToken);
    console.log('📤 [API TEST] X-API-KEY:', apiKey);
    
    setIsLoading(true);
    setResults([]);
    
    const testResults: ApiTestResult[] = [];

    try {
      // Test 1: Verificar conectividad básica
      console.log('🔍 [API TEST] Paso 1: Probando conectividad...');
      testResults.push({
        step: 'Conectividad',
        success: false,
        message: 'Probando conectividad con api.sebastian.cl...'
      });
      setResults([...testResults]);

      try {
        const connectResponse = await fetch('https://api.sebastian.cl/Auth/v1/tokens/login', {
          method: 'GET',
          headers: {
            'X-API-TOKEN': apiToken,
            'X-API-KEY': apiKey,
            'Content-Type': 'application/json'
          }
        });

        console.log('📥 [API TEST] Connect Response Status:', connectResponse.status);
        console.log('📥 [API TEST] Connect Response Headers:', Object.fromEntries(connectResponse.headers.entries()));

        testResults[0] = {
          step: 'Conectividad',
          success: connectResponse.ok,
          message: connectResponse.ok 
            ? `✅ Conexión exitosa (${connectResponse.status})`
            : `❌ Error de conexión (${connectResponse.status}: ${connectResponse.statusText})`
        };
        setResults([...testResults]);

      if (connectResponse.ok) {
        // Test 2: Obtener token de login
        testResults.push({
          step: 'Login Token',
          success: false,
          message: 'Obteniendo token de login...'
        });
        setResults([...testResults]);

        const responseText = await connectResponse.text();
        console.log('📥 [API TEST] Login Response Raw:', responseText);
        
        let loginData;
        try {
          loginData = JSON.parse(responseText);
          console.log('📥 [API TEST] Login Response Parsed:', JSON.stringify(loginData, null, 2));
        } catch (parseError) {
          console.error('❌ [API TEST] Error parsing login response:', parseError);
          testResults[1] = {
            step: 'Login Token',
            success: false,
            message: `❌ Error parseando respuesta: ${responseText}`,
            data: { error: parseError, rawResponse: responseText }
          };
          setResults([...testResults]);
          return;
        }
        
        testResults[1] = {
          step: 'Login Token',
          success: true,
          message: `✅ Token obtenido: ${loginData.token?.substring(0, 20)}...`,
          data: loginData
        };
        setResults([...testResults]);          // Test 3: Verificar endpoint de votaciones (si tenemos JWT)
          testResults.push({
            step: 'Vote API',
            success: false,
            message: 'Probando acceso a API de votaciones...'
          });
          setResults([...testResults]);

          // Verificar si hay JWT almacenado
          const storedJWT = localStorage.getItem('vote_app_jwt');
          if (storedJWT) {
            try {
              const voteResponse = await fetch('https://api.sebastian.cl/vote/v1/polls/', {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${storedJWT}`,
                  'Content-Type': 'application/json'
                }
              });

              testResults[2] = {
                step: 'Vote API',
                success: voteResponse.ok,
                message: voteResponse.ok 
                  ? `✅ Acceso a votaciones exitoso (${voteResponse.status})`
                  : `❌ Error accediendo votaciones (${voteResponse.status})`
              };

              if (voteResponse.ok) {
                const pollsData = await voteResponse.json();
                testResults[2].data = pollsData;
                testResults[2].message += ` - ${pollsData.length || 0} encuestas encontradas`;
              }
            } catch (error) {
              testResults[2] = {
                step: 'Vote API',
                success: false,
                message: `❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`
              };
            }
          } else {
            testResults[2] = {
              step: 'Vote API',
              success: false,
              message: '⚠️ No hay JWT almacenado. Necesitas completar el flujo de autenticación.'
            };
          }
          setResults([...testResults]);
        }

      } catch (error) {
        testResults[0] = {
          step: 'Conectividad',
          success: false,
          message: `❌ Error de red: ${error instanceof Error ? error.message : 'Error desconocido'}`
        };
        setResults([...testResults]);
      }

    } catch (error) {
      console.error('Error en test de API:', error);
      testResults.push({
        step: 'Error General',
        success: false,
        message: `❌ Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`
      });
      setResults([...testResults]);
    }

    setIsLoading(false);
  };

  const getStatusIcon = (success: boolean, isLoading: boolean) => {
    if (isLoading) return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    return success ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Test de API Sebastian.cl
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Configuración de credenciales */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="api-token">X-API-TOKEN</Label>
              <Input
                id="api-token"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                placeholder="sebastian.cl"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-key">X-API-KEY</Label>
              <Input
                id="api-key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="aaa-bbb-ccc-ddd"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Información importante */}
          <Alert>
            <Key className="h-4 w-4" />
            <AlertDescription>
              <strong>Credenciales actuales son de ejemplo.</strong> Para acceder a encuestas reales, 
              necesitas obtener credenciales válidas de Sebastian.cl para los headers X-API-TOKEN y X-API-KEY.
            </AlertDescription>
          </Alert>

          {/* Botón de test */}
          <Button 
            onClick={testSebastianApi} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Probando API...
              </>
            ) : (
              <>
                <Globe className="h-4 w-4 mr-2" />
                Probar Conectividad con Sebastian.cl
              </>
            )}
          </Button>

          {/* Resultados */}
          {results.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-sm">Resultados del Test:</h3>
              {results.map((result, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  {getStatusIcon(result.success, isLoading && index === results.length - 1)}
                  <div className="flex-1">
                    <div className="font-medium text-sm">{result.step}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {result.message}
                    </div>
                    {result.data && (
                      <details className="mt-2">
                        <summary className="text-xs cursor-pointer text-blue-600">
                          Ver datos
                        </summary>
                        <pre className="text-xs bg-black/5 p-2 rounded mt-1 overflow-x-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Guía de próximos pasos */}
          {results.some(r => !r.success) && (
            <Alert>
              <AlertDescription>
                <strong>Próximos pasos:</strong>
                <ul className="mt-2 text-sm space-y-1">
                  <li>• Contacta al proveedor de Sebastian.cl para obtener credenciales válidas</li>
                  <li>• Verifica que tengas permisos para acceder a la API de votaciones</li>
                  <li>• Mientras tanto, la app funciona perfectamente con datos mock</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Botones */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cerrar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}