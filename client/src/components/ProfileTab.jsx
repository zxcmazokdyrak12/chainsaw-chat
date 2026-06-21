export default function ProfileTab({ avatar, username, rooms, currentRoom, T, theme, onLogout }) {
  return (
    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'20px' }}>
      <img src={avatar.src} style={{ height:'160px', width:'160px', objectFit:'cover', borderRadius:'50%', border:'4px solid #cc2200', boxShadow:'0 0 30px rgba(204,34,0,0.4)' }} />
      <div style={{ fontFamily:'BlambotClassic, sans-serif', textAlign:'center', color: T.titleColor }}>
        <div style={{ fontSize:'28px', letterSpacing:'3px' }}>{username}</div>
        <div style={{ fontSize:'13px', color:'#cc2200', marginTop:'4px', letterSpacing:'2px' }}>{avatar.name}</div>
        <div style={{ fontSize:'12px', opacity:0.5, marginTop:'8px', fontFamily:"'AnimeAce', sans-serif" }}>
          {rooms.find(r=>r.id===currentRoom)?.name}
        </div>
      </div>

      <button
        onClick={onLogout}
        style={{
          marginTop: '10px',
          padding: '10px 24px',
          backgroundColor: '#cc2200',
          color: '#fff',
          border: '3px solid #000',
          fontFamily: 'BlambotClassic, sans-serif',
          fontSize: '14px',
          letterSpacing: '2px',
          cursor: 'pointer',
          fontWeight: 'bold',
          boxShadow: '4px 4px 0px #000',
          transition: 'all 0.1s ease'
        }}
        onMouseDown={(e) => e.currentTarget.style.transform = 'translate(2px, 2px)'}
        onMouseUp={(e) => e.currentTarget.style.transform = 'none'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
      >
        LOG OUT 🌸
      </button>
    </div>
  )
}
