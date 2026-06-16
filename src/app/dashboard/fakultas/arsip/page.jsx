"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ArsipPage() {
  const router = useRouter();
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2,
        duration: Math.random() * 3 + 2,
        delay: Math.random() * 2,
      }))
    );
  }, []);

  return (
    <div style={{
      minHeight: "100%",
      background: "linear-gradient(135deg, #0B2A4A 0%, #1a4a7a 50%, #0B2A4A 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden",
      borderRadius: 16,
    }}>

      {/* Floating particles */}
      {particles.map(p => (
        <div key={p.id} style={{
          position: "absolute",
          left: `${p.x}%`,
          top: `${p.y}%`,
          width: p.size,
          height: p.size,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.15)",
          animation: `floatUp ${p.duration}s ${p.delay}s infinite ease-in-out`,
        }} />
      ))}

      {/* Grid lines background */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
        borderRadius: 16,
      }} />

      {/* Glowing orb */}
      <div style={{
        position: "absolute",
        width: 300,
        height: 300,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
        animation: "pulse 3s infinite ease-in-out",
      }} />

      {/* Icon container */}
      <div style={{
        position: "relative",
        zIndex: 10,
        textAlign: "center",
        padding: "0 24px",
      }}>

        {/* Rocket icon */}
        <div style={{
          fontSize: 80,
          animation: "rocketFloat 3s infinite ease-in-out",
          display: "inline-block",
          marginBottom: 8,
          filter: "drop-shadow(0 0 20px rgba(59,130,246,0.5))",
        }}>
          🚀
        </div>

        {/* NEXT UPGRADE text */}
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.4em",
          color: "rgba(147,197,253,0.7)",
          textTransform: "uppercase",
          marginBottom: 12,
          animation: "fadeInUp 0.6s 0.2s both",
        }}>
          Coming Soon
        </div>

        <h1 style={{
          fontSize: 48,
          fontWeight: 900,
          background: "linear-gradient(135deg, #ffffff 0%, #93c5fd 50%, #3b82f6 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          margin: 0,
          lineHeight: 1.1,
          animation: "fadeInUp 0.6s 0.4s both",
          letterSpacing: "-1px",
        }}>
          NEXT
        </h1>
        <h1 style={{
          fontSize: 48,
          fontWeight: 900,
          background: "linear-gradient(135deg, #3b82f6 0%, #93c5fd 50%, #ffffff 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          margin: "0 0 16px 0",
          lineHeight: 1.1,
          animation: "fadeInUp 0.6s 0.5s both",
          letterSpacing: "-1px",
        }}>
          UPGRADE
        </h1>

        {/* Divider */}
        <div style={{
          width: 60,
          height: 2,
          background: "linear-gradient(90deg, transparent, #3b82f6, transparent)",
          margin: "0 auto 20px",
          animation: "fadeInUp 0.6s 0.6s both",
        }} />

        <p style={{
          color: "rgba(255,255,255,0.5)",
          fontSize: 14,
          margin: "0 0 8px",
          animation: "fadeInUp 0.6s 0.7s both",
        }}>
          Fitur Arsip Surat sedang dalam negosiasi
        </p>
        <p style={{
          color: "rgba(255,255,255,0.3)",
          fontSize: 12,
          margin: "0 0 36px",
          animation: "fadeInUp 0.6s 0.8s both",
        }}>
            Harap bersabar dan nantikan update selanjutnya!
        </p>

        {/* Progress bar */}
        <div style={{
          width: 240,
          height: 4,
          background: "rgba(255,255,255,0.1)",
          borderRadius: 99,
          margin: "0 auto 36px",
          overflow: "hidden",
          animation: "fadeInUp 0.6s 0.9s both",
        }}>
          <div style={{
            height: "100%",
            width: "65%",
            background: "linear-gradient(90deg, #3b82f6, #93c5fd)",
            borderRadius: 99,
            animation: "progressLoad 2s 1s both ease-out",
            boxShadow: "0 0 10px rgba(59,130,246,0.5)",
          }} />
        </div>

        {/* Back button */}
        <button
          onClick={() => router.back()}
          style={{
            padding: "10px 28px",
            borderRadius: 99,
            border: "1px solid rgba(59,130,246,0.4)",
            background: "rgba(59,130,246,0.1)",
            color: "#93c5fd",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            animation: "fadeInUp 0.6s 1s both",
            backdropFilter: "blur(8px)",
            transition: "all 0.2s",
            letterSpacing: "0.05em",
          }}
          onMouseEnter={e => {
            e.target.style.background = "rgba(59,130,246,0.25)";
            e.target.style.borderColor = "rgba(59,130,246,0.8)";
          }}
          onMouseLeave={e => {
            e.target.style.background = "rgba(59,130,246,0.1)";
            e.target.style.borderColor = "rgba(59,130,246,0.4)";
          }}
        >
          ← Kembali
        </button>
      </div>

      <style>{`
        @keyframes floatUp {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.15; }
          50% { transform: translateY(-20px) scale(1.2); opacity: 0.4; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 1; }
        }
        @keyframes rocketFloat {
          0%, 100% { transform: translateY(0) rotate(-5deg); }
          50% { transform: translateY(-16px) rotate(5deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes progressLoad {
          from { width: 0%; }
          to { width: 65%; }
        }
      `}</style>
    </div>
  );
}