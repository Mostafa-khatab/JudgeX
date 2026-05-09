import api from './api';

const chatbotService = {
  sendMessage: (data) => {
    return api.post('/chatbot/message', data);
  },
};

export default chatbotService;
