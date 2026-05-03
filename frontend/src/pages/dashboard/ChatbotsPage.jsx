import { useState } from 'react';
import Chatbots from './Chatbots';
import ChatbotBuilder from './ChatbotBuilder';

// Maneja la navegación entre lista y editor sin cambiar de ruta
const ChatbotsPage = () => {
  const [view, setView] = useState('list'); // 'list' | 'create' | 'edit'
  const [selectedChatbot, setSelectedChatbot] = useState(null);

  // Navega al editor de creación
  const handleCreate = () => {
    setSelectedChatbot(null);
    setView('create');
  };

  // Navega al editor con el chatbot seleccionado
  const handleEdit = (chatbot) => {
    setSelectedChatbot(chatbot);
    setView('edit');
  };

  // Vuelve a la lista
  const handleBack = () => {
    setSelectedChatbot(null);
    setView('list');
  };

  if (view === 'list') {
    return <Chatbots onCreateClick={handleCreate} onEditClick={handleEdit} />;
  }

  return <ChatbotBuilder chatbot={selectedChatbot} onBack={handleBack} />;
};

export default ChatbotsPage;