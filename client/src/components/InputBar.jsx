import { motion } from 'framer-motion'

export default function InputBar({ input, onInputChange, onSend, isRecording, onStartRecording, onStopRecording, T, theme, currentRoom, rooms }) {
  return (
    <div style={{ padding:'10px 16px', background: T.inputZoneBg, borderTop:`4px solid ${T.inputBorder}`, display:'flex', gap:'10px', transition:'background 0.4s' }}>
      <motion.button
        whileTap={{ scale:0.9 }}
        onMouseDown={onStartRecording}
        onMouseUp={onStopRecording}
        onTouchStart={onStartRecording}
        onTouchEnd={onStopRecording}
        style={{
          width:'44px', height:'44px', borderRadius:'0',
          background: isRecording ? '#cc2200' : T.inputBg,
          border:`3px solid ${T.inputBorder}`,
          cursor:'pointer', fontSize:'18px',
          display:'flex', alignItems:'center', justifyContent:'center',
          transition:'background 0.2s',
          flexShrink:0,
        }}
      >
        {isRecording ? '⏹' : '🎤'}
      </motion.button>
      <input
        style={{ flex:1, padding:'10px 14px', background: T.inputBg, border:`3px solid ${T.inputBorder}`, color: T.inputColor, fontSize:'14px', outline:'none', fontFamily:'BlambotClassic, sans-serif', letterSpacing:'1px', clipPath:'polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%)', transition:'background 0.4s' }}
        value={input}
        onChange={onInputChange}
        onKeyDown={e => e.key === 'Enter' && onSend()}
        placeholder={`write in ${rooms.find(r=>r.id===currentRoom)?.name || ''}...`}
      />
      <motion.button whileTap={{ scale:0.92, skewX:-5 }} whileHover={{ skewX:-5 }} onClick={onSend} style={{ padding:'10px 20px', background: T.btnBg, color: T.btnColor, border:`3px solid ${T.inputBorder}`, fontFamily:'BlambotClassic, sans-serif', fontSize:'14px', letterSpacing:'2px', cursor:'pointer', clipPath:'polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%)', boxShadow: T.shadow, transition:'background 0.4s' }}>
        VROOM ⛓
      </motion.button>
    </div>
  )
}
