export default function UnauthorizedPage() {
  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem',background:'#f9fafb'}}>
      <div style={{background:'white',border:'0.5px solid #e5e7eb',borderRadius:'12px',padding:'3rem 2.5rem',maxWidth:'420px',width:'100%',textAlign:'center',position:'relative',overflow:'hidden'}}>
        
        <style>{`
          @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-18px)}}
          @keyframes wiggle{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(8deg)}}
          @keyframes fadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
          @keyframes pulse-ring{0%{transform:scale(0.8);opacity:1}100%{transform:scale(2.2);opacity:0}}
          @keyframes shake{0%,100%{transform:translateX(0)}10%{transform:translateX(-8px)}20%{transform:translateX(8px)}30%{transform:translateX(-6px)}40%{transform:translateX(6px)}50%{transform:translateX(-4px)}60%{transform:translateX(4px)}70%{transform:translateX(-2px)}80%{transform:translateX(2px)}}
          .emoji-bounce{animation:bounce 1.2s ease-in-out infinite}
          .wiggle-letter{display:inline-block;animation:wiggle 0.4s ease-in-out infinite}
          .wiggle-letter:nth-child(2){animation-delay:0.1s}
          .wiggle-letter:nth-child(3){animation-delay:0.2s}
          .fade-in{animation:fadeIn 0.5s ease forwards}
          .pulse{position:absolute;top:50%;left:50%;width:80px;height:80px;margin:-40px 0 0 -40px;border-radius:50%;border:3px solid #E24B4A;animation:pulse-ring 1.5s ease-out infinite}
          .card-shake{animation:shake 0.6s ease-in-out}
        `}</style>

        <div className="pulse"></div>
        <div className="pulse" style={{animationDelay:'0.5s'}}></div>

        <div className="emoji-bounce" style={{fontSize:'64px',marginBottom:'1.5rem',position:'relative',zIndex:1}}>🚫</div>

        <div style={{fontSize:'2rem',fontWeight:500,color:'#E24B4A',marginBottom:'0.5rem',letterSpacing:'0.05em'}}>
          {'No! No! No!'.split('').map((c,i)=>(
            <span key={i} className="wiggle-letter" style={{animationDelay:`${i*0.05}s`}}>{c}</span>
          ))}
        </div>

        <div className="fade-in" style={{animationDelay:'0.2s',opacity:0}}>
          <p style={{fontSize:'15px',color:'#6b7280',margin:'1rem 0 0.25rem'}}>Kamu tidak punya izin mengakses halaman ini.</p>
          <p style={{fontSize:'13px',color:'#9ca3af',margin:'0 0 1.5rem'}}>Coba balik ke halaman yang sesuai dengan rolemu ya!</p>
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