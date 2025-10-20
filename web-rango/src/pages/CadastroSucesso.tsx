/**
 * CadastroSucesso.tsx
 * Página de confirmação após cadastro de entregador
 */

import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  Clock, 
  Mail, 
  Download,
  ArrowRight,
  Smartphone
} from "lucide-react";

export default function CadastroSucesso() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-3xl">Cadastro Realizado com Sucesso!</CardTitle>
          <CardDescription className="text-lg">
            Bem-vindo à equipe Rappy Delivery
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Status Card */}
          <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    Aguardando Aprovação
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    Seu cadastro está em análise. Nossa equipe verificará seus dados e você receberá 
                    um email em até 48 horas com o resultado da análise.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Próximos Passos */}
          <div>
            <h3 className="font-semibold mb-4">Próximos Passos:</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium">Verificação de Documentos</p>
                  <p className="text-sm text-muted-foreground">
                    Nossa equipe analisará suas informações cadastrais
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium">Notificação por Email</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Você receberá um email em: <strong>{localStorage.getItem('delivery_email') || 'seu email'}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium">Baixe o Aplicativo</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Smartphone className="h-3 w-3" />
                    Após aprovação, baixe o app do entregador para começar
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  4
                </div>
                <div>
                  <p className="font-medium">Comece a Ganhar!</p>
                  <p className="text-sm text-muted-foreground">
                    Fique online e receba solicitações de entrega
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Download App */}
          <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-1">Aplicativo do Entregador</h3>
                  <p className="text-sm text-muted-foreground">
                    Disponível em breve para download
                  </p>
                </div>
                <Button variant="outline" disabled>
                  <Download className="h-4 w-4 mr-2" />
                  Em Breve
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Informações de Contato */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-center text-muted-foreground">
              <strong>Dúvidas?</strong> Entre em contato: suporte@rappy.com ou (11) 3000-0000
            </p>
          </div>

          {/* Botão Voltar */}
          <div className="flex gap-3">
            <Button
              className="flex-1"
              variant="outline"
              onClick={() => navigate('/')}
            >
              Voltar ao Início
            </Button>
            <Button
              className="flex-1"
              onClick={() => navigate('/login')}
            >
              Fazer Login
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

