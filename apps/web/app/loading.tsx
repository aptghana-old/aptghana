export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0A0F1E] flex flex-col items-center justify-center gap-6">
      {/* Animated bar */}
      <div className="w-48 h-1 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full bg-[#84CC16] rounded-full"
          style={{
            animation: "apt-loading 1.4s ease-in-out infinite",
          }}
        />
      </div>

      {/* Logo mark */}
      <div className="flex items-center gap-2 opacity-40">
        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-orange-500 text-white font-bold text-xs">
          APT
        </div>
        <span className="text-white/60 text-xs font-medium tracking-widest uppercase">
          Loading
        </span>
      </div>

      <style>{`
        @keyframes apt-loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
