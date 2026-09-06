import React, { useState } from 'react';
import PreceptorFAB from './PreceptorFAB';
import PreceptorDrawer from './PreceptorDrawer';

/**
 * Componente Container PreceptorChat
 * Gerencia o estado de abertura do Drawer, a lista de mensagens e a comunicação com a rota /api/chat
 */
export default function PreceptorChat({ clinicalContext = {}, apiEndpoint = '/api/chat' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      sender: 'Preceptor IA',
      content: 'Olá! Sou o seu Preceptor de Nutrição Clínica. Estou aqui para instigar seu raciocínio clínico e auxiliar na sua tomada de decisão.\n\nMeu papel não é fornecer respostas prontas, fórmulas calculadas ou dizer se sua conduta está certa ou errada — mas sim orientá-lo pelo Método Socrático.\n\nQual aspecto fisiopatológico ou conduta você gostaria de debater agora?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const handleSendMessage = async (text) => {
    if (!text || isLoading) return;

    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      sender: 'Estudante',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          clinicalContext,
          history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content }))
        })
      });

      let assistantReply = '';
      if (response.ok) {
        const data = await response.json();
        assistantReply = data.reply || data.content;
      }

      if (!assistantReply) {
        // Fallback socrático pedagógico
        assistantReply = `Refletindo sobre o quadro deste paciente (${clinicalContext.paciente?.nome || 'paciente'}, ${clinicalContext.paciente?.idade || '--'}, ${clinicalContext.paciente?.patologiasHipoteses || 'condição atual'}):\n\n• Quais mecanismos fisiopatológicos você acredita que devam nortear essa decisão?\n• Como as diretrizes clínicas orientam essa conduta?\n• Qual é o desfecho esperado na recuperação metabólica dele?`;
      }

      const assistantMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        sender: 'Preceptor IA',
        content: assistantReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('[PreceptorChat] Erro ao enviar mensagem:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          role: 'assistant',
          sender: 'Preceptor IA',
          content: 'Houve uma instabilidade na conexão com o preceptor. Considerando o paciente em atendimento, qual ponto você gostaria de retomar?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PreceptorFAB onClick={() => setIsOpen(true)} isOpen={isOpen} />
      <PreceptorDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        clinicalContext={clinicalContext}
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
    </>
  );
}
