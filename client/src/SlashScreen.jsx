import { motion } from 'framer-motion';

const SlashScreen = ({ onComplete }) => {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, overflow: 'hidden', pointerEvents: 'none' }}>
      
      {/* РУКА ДЕНДЗИ */}
      <motion.img
        src="/hand.png" // Убедись, что картинка лежит в public/hand.png
        initial={{ 
          x: '-120%', 
          y: '-50%', 
          rotate: 90 // Поворачиваем вертикальную руку в горизонтальное положение
        }} 
        animate={{ x: '150%' }} // Пролетает насквозь
        transition={{ 
          duration: 1.5, // Медленный, тяжелый разрез
          ease: "easeInOut" 
        }}
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          width: '800px', // Увеличил размер, так как рука длинная
          zIndex: 300,
          filter: 'drop-shadow(0 0 40px rgba(220, 38, 38, 0.8))',
          // Отражаем, если нужно, чтобы пила была снизу (зависит от оригинала)
          transformOrigin: 'center',
        }}
      />

      {/* КРАСНЫЙ СЛЕД РАЗРЕЗА */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ 
          delay: 0.3, // След появляется, когда пила заходит на экран
          duration: 1.0, 
          ease: "linear" 
        }}
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          width: '100%',
          height: '15px',
          backgroundColor: '#dc2626',
          transform: 'translateY(-50%)',
          zIndex: 150,
          boxShadow: '0 0 80px #dc2626',
          transformOrigin: 'left'
        }}
      />

      {/* ВЕРХНЯЯ ПОЛОВИНА ЭКРАНА */}
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: "-100%" }}
        transition={{ 
          delay: 1.6, // Ждем завершения пролета руки
          duration: 0.8, 
          ease: [0.45, 0, 0.55, 1] 
        }}
        onAnimationComplete={onComplete}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '50%',
          backgroundColor: 'black',
          zIndex: 100,
          borderBottom: '2px solid #dc2626'
        }}
      />
      
      {/* НИЖНЯЯ ПОЛОВИНА ЭКРАНА */}
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: "100%" }}
        transition={{ 
          delay: 1.6, 
          duration: 0.8, 
          ease: [0.45, 0, 0.55, 1] 
        }}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '50%',
          backgroundColor: 'black',
          zIndex: 100,
          borderTop: '2px solid #dc2626'
        }}
      />

      {/* НАДПИСЬ VROOM! */}
      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.5, 1], opacity: 1 }}
        transition={{ delay: 1.7, duration: 0.4 }}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          fontSize: '12vw',
          fontWeight: '900',
          fontStyle: 'italic',
          zIndex: 250,
          textShadow: '0 0 30px #dc2626',
          textTransform: 'uppercase'
        }}
      >
        VROOM!
      </motion.div>
    </div>
  );
};

export default SlashScreen;