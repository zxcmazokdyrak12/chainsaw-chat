import { useRef, useState } from 'react'
import { socket } from '../lib/socket'

// hold-to-record voice messages: MediaRecorder → base64 → socket
export function useVoiceRecorder(currentRoom: string, username: string, avatarSrc: string) {
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks   = useRef<Blob[]>([])
  const avatar = { src: avatarSrc }

  const startRecording = async (): Promise<void> => {
    try {
      if (window && (window as any).Capacitor && (window as any).Capacitor.isNativePlatform) {
        try {
          await (window as any).Capacitor.Plugins.Permissions.requestPermission({ name: 'microphone' });
        } catch (pe) {
          console.warn(pe);
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Настройка для Firefox с resistFingerprinting: 
      // Не перебираем mimeType вручную, а даем браузеру использовать дефолтный системный контейнер
      let options = {};
      
      // Если это Firefox/Линукс/Мак с защитой, принудительный opus в webm может ломаться.
      // Проверяем только самый базовый вариант, иначе оставляем пустой объект
      if (MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        options = { mimeType: 'audio/ogg' };
      }
   
      mediaRecorder.current = new MediaRecorder(stream, options);
      audioChunks.current = [];
   
      mediaRecorder.current.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) {
          audioChunks.current.push(e.data);
        }
      };
   
      mediaRecorder.current.onstop = async () => {
        if (audioChunks.current.length === 0) {
          console.error("Чанки аудио пусты!");
          return;
        }
   
        const finalType = mediaRecorder.current?.mimeType || 'audio/webm';
        const blob = new Blob(audioChunks.current, { type: finalType });

        if (blob.size > 3 * 1024 * 1024) { 
          alert('Voice message too long!');
          stream.getTracks().forEach(t => t.stop());
          return;
        }
   
        // Обернем FileReader в Promise, чтобы гарантировать отправку ТЕКСТА, а не битого объекта
        const readBlobAsBase64 = (audioBlob: Blob): Promise<string> => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              let res = reader.result as string;
              if (res && res.includes('data:application/octet-stream;base64,')) {
                res = res.replace('data:application/octet-stream;base64,', `data:${finalType};base64,`);
              }
              resolve(res);
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(audioBlob);
          });
        };

        try {
          const base64Audio = await readBlobAsBase64(blob);

          if (!base64Audio || base64Audio.length < 100) {
            console.error('Сгенерирована слишком короткая или пустая Base64 строка');
            return;
          }

          socket.emit('send_message', {
            roomId: currentRoom,
            username,
            avatar: avatar.src,
            content: '🎤 voice message',
            type: 'audio',
            audioData: base64Audio,
          });
        } catch (err) {
          console.error('Ошибка при чтении Blob в Base64:', err);
        }

        // Выключаем микрофон
        stream.getTracks().forEach(t => t.stop());
      };
   
      // Запускаем без параметров времени
      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (e) {
      console.error(e);
      alert('Microphone access denied');
    }
  }

  const stopRecording = (): void => {
    mediaRecorder.current?.stop()
    setIsRecording(false)
  }

  return { isRecording, startRecording, stopRecording }
}
