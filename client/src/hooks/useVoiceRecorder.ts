import { useRef, useState } from 'react'
import { socket } from '../lib/socket'
import { uploadMedia } from '../lib/media'

// hold-to-record voice messages: MediaRecorder → upload to /media → socket
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
   
        // voice goes to /media like pictures; an old server without /media still gets inline base64
        const sendInline = () => new Promise<void>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            let res = reader.result as string
            if (res?.startsWith('data:application/octet-stream;base64,')) {
              res = res.replace('data:application/octet-stream;base64,', `data:${finalType};base64,`)
            }
            if (res && res.length > 100) {
              socket.emit('send_message', { roomId: currentRoom, username, avatar: avatar.src, content: '🎤 voice message', type: 'audio', audioData: res })
            }
            resolve()
          }
          reader.onerror = () => resolve()
          reader.readAsDataURL(blob)
        })

        try {
          const mediaId = await uploadMedia(blob, currentRoom)
          socket.emit('send_message', { roomId: currentRoom, username, avatar: avatar.src, type: 'audio', mediaId })
        } catch (err) {
          console.warn('[voice] upload failed, sending inline:', err)
          await sendInline()
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
