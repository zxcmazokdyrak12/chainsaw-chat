export default function SettingsTab({ T }) {
  return (
    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'16px' }}>
      <img src="/makima.png" style={{ height:'160px', opacity:0.4 }} />
      <span style={{ fontFamily:'BlambotClassic, sans-serif', fontSize:'20px', color: T.titleColor, letterSpacing:'3px' }}>НАСТРОЙКИ — СКОРО</span>
    </div>
  )
}
