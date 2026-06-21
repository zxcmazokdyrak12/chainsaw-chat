import { motion, AnimatePresence } from 'framer-motion'

export default function PochitaEgg({ visible, hearts }) {
  return (
    <AnimatePresence>
      {visible && (
        <>
          {hearts.map(heart => (
            <motion.img key={heart.id} src={`/heart_${heart.id}.png`} initial={{ opacity:0, rotate:heart.rotate, scale:0.5 }} animate={{ opacity:[0,1,1,0], y:'-50vh', scale:[0.5,1.2,1] }} transition={{ duration:2, delay:heart.delay, ease:'easeOut' }} style={{ position:'fixed', bottom:'80px', left:`${heart.x}%`, width:`${heart.size}px`, height:`${heart.size}px`, objectFit:'contain', zIndex:100, pointerEvents:'none' }} />
          ))}
          <motion.img src="/pochita.png" initial={{ y:'200px', rotate:-15 }} animate={{ y:0, rotate:[-15,10,-8,5,0] }} exit={{ y:'200px', rotate:15 }} transition={{ type:'spring', stiffness:200, damping:18 }} style={{ position:'fixed', bottom:'60px', left:'50%', transform:'translateX(-50%)', width:'160px', objectFit:'contain', zIndex:99, pointerEvents:'none', filter:'drop-shadow(0 0 20px rgba(255,100,0,0.6))' }} />
        </>
      )}
    </AnimatePresence>
  )
}
