import { motion, AnimatePresence } from 'framer-motion'

const CHAINSAW_IMG = '/hand.png'
const CHAINSAW_SFX = '/chainsaw.mp3'

export default function IntroScreen({ phase, onStart }) {
  return (
    <div style={{ height:'100vh', background:'#000', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' }}>
      <motion.div style={{ position:'absolute', left:0, right:0, top:0, height:'100%', background:'#111', zIndex:2, clipPath:'polygon(0 0,100% 0,100% 50%,0 50%)' }} animate={phase==='slashing' ? { x:-120, y:-120, opacity:0 } : {}} transition={{ duration:0.7, ease:'easeIn' }} />
      <motion.div style={{ position:'absolute', left:0, right:0, bottom:0, height:'100%', background:'#111', zIndex:2, clipPath:'polygon(0 50%,100% 50%,100% 100%,0 100%)' }} animate={phase==='slashing' ? { x:120, y:120, opacity:0 } : {}} transition={{ duration:0.7, ease:'easeIn' }} />
      {phase === 'slashing' && (
        <motion.div initial={{ scaleX:0, opacity:1 }} animate={{ scaleX:1, opacity:0 }} transition={{ duration:0.5 }} style={{ position:'absolute', top:'50%', left:0, right:0, height:'3px', background:'#cc2200', zIndex:5, transformOrigin:'left', boxShadow:'0 0 12px #cc2200' }} />
      )}
      <motion.img src={CHAINSAW_IMG} alt="chainsaw" initial={{ x:'-60vw', y:'60vh', rotate:-35, opacity:0 }} animate={phase==='slashing' ? { x:'60vw', y:'-60vh', rotate:-35, opacity:[0,1,1,0] } : { opacity:0 }} transition={{ duration:0.7, ease:'easeIn' }} style={{ position:'absolute', width:'340px', objectFit:'contain', zIndex:3, filter:'drop-shadow(0 0 20px rgba(204,34,0,0.7))' }} />
      <AnimatePresence>
        {phase === 'intro' && (
          <motion.button key="btn" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, scale:0.8 }} whileHover={{ scale:1.08, skewX:-8 }} whileTap={{ scale:0.93 }} onClick={onStart} style={{ position:'relative', zIndex:4, background:'transparent', color:'#fff', border:'4px solid #fff', padding:'20px 48px', fontSize:'28px', fontFamily:'BlambotClassic, sans-serif', letterSpacing:'4px', cursor:'pointer' }}>
            START ENGINE ⛓
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
