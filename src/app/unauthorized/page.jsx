export default function UnauthorizedPage() {
  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem',background:'#f9fafb'}}>
      <div style={{background:'white',border:'0.5px solid #e5e7eb',borderRadius:'12px',padding:'3rem 2.5rem',maxWidth:'480px',width:'100%',textAlign:'center',position:'relative',overflow:'hidden'}}>
        
        <style>{`
          @keyframes wiggle{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(8deg)}}
          @keyframes fadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
          .wiggle-letter{display:inline-block;animation:wiggle 0.4s ease-in-out infinite}
          .fade-in{animation:fadeIn 0.5s ease forwards}
        `}</style>

        <video 
          src="/Vidios/Animasi.mp4" 
          autoPlay 
          loop 
          muted 
          playsInline
          style={{width:'100%',borderRadius:'12px',marginBottom:'1.5rem'}}
        />

        <div style={{fontSize:'2rem',fontWeight:500,color:'#E24B4A',marginBottom:'0.5rem'}}>
          {'No! No! No!'.split('').map((c,i)=>(
            <span key={i} className="wiggle-letter" style={{animationDelay:`${i*0.05}s`}}>{c}</span>
          ))}
        </div>

        <div className="fade-in" style={{opacity:0}}>
          <p style={{fontSize:'15px',color:'#6b7280',margin:'1rem 0 0.25rem'}}>Mau ngapain ya Kak.....</p>
          <p style={{fontSize:'13px',color:'#9ca3af',margin:'0 0 1.5rem'}}>Balik ke halaman yang sesuai dengan rolemu ya!</p>
          <p style={{fontSize:'11px', color:'#12ca3af', margin:'0 0 2.1rem'}}>cieee ga bisaa yaaa</p>
        </div>

        <a href="/login" style={{display:'inline-flex',alignItems:'center',gap:'6px',padding:'10px 20px',background:'#FCEBEB',color:'#A32D2D',border:'0.5px solid #F09595',borderRadius:'8px',fontSize:'14px',textDecoration:'none',fontWeight:500}}>
          ← Kembali ke Login
        </a>

        <div style={{marginTop:'2rem',paddingTop:'1.5rem',borderTop:'0.5px solid #e5e7eb'}}>
          <span style={{fontSize:'64px',fontWeight:500,color:'#e5e7eb',lineHeight:1}}>403</span>
        </div>
      </div>
    </div>
  )
}