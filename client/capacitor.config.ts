import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.chainsawchat.app',
  appName: 'Chainsaw Chat',
  webDir: 'dist', // или 'out' в зависимости от твоего билда
  server: {
    // Укажи здесь URL твоего запущенного бэкенда на Render,
    // чтобы мобилка знала, куда стучаться за сообщениями
    url: 'https://chainsaw-chat.onrender.com', 
    cleartext: true
  }
};

export default config;