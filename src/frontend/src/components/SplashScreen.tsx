import { useEffect, useRef, useState } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

const SPARK_POSITIONS = Array.from({ length: 8 }, (_, i) => ({
  id: `spark-${i}`,
  top: `${50 + 45 * Math.sin((i / 8) * Math.PI * 2)}%`,
  left: `${50 + 45 * Math.cos((i / 8) * Math.PI * 2)}%`,
  bg: i % 2 === 0 ? "#ff9800" : "#ff5722",
  anim: `sparkFloat ${0.8 + i * 0.15}s ease-in-out infinite alternate`,
}));

function playSplashSound(ctx: AudioContext) {
  try {
    const play = (
      freq: number,
      start: number,
      duration: number,
      type: OscillatorType = "sine",
      gain = 0.18,
    ) => {
      const osc = ctx.createOscillator();
      const vol = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      osc.frequency.exponentialRampToValueAtTime(
        freq * 1.6,
        ctx.currentTime + start + duration * 0.7,
      );
      vol.gain.setValueAtTime(0, ctx.currentTime + start);
      vol.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + 0.05);
      vol.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + start + duration,
      );
      osc.connect(vol);
      vol.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    play(200, 0.0, 0.4, "sawtooth", 0.12);
    play(320, 0.3, 0.4, "sawtooth", 0.12);
    play(480, 0.55, 0.5, "sawtooth", 0.14);
    play(800, 0.9, 0.3, "square", 0.1);
    play(600, 1.0, 0.3, "square", 0.08);
    play(300, 1.6, 0.8, "sawtooth", 0.14);
    play(600, 1.9, 0.7, "sine", 0.16);
    play(900, 2.1, 0.6, "sine", 0.14);
    play(1200, 2.5, 0.5, "sine", 0.18);

    const bass = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bass.type = "sine";
    bass.frequency.setValueAtTime(80, ctx.currentTime + 0.0);
    bass.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.4);
    bassGain.gain.setValueAtTime(0.25, ctx.currentTime + 0.0);
    bassGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    bass.connect(bassGain);
    bassGain.connect(ctx.destination);
    bass.start(ctx.currentTime);
    bass.stop(ctx.currentTime + 0.6);

    setTimeout(() => ctx.close(), 4000);
  } catch {
    // silently skip
  }
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"loading" | "flash" | "done">("loading");
  const [soundPlayed, setSoundPlayed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Attempt autoplay on mount; attach interaction fallback
  useEffect(() => {
    let played = false;

    const tryPlay = () => {
      if (played) return;
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;
        if (ctx.state === "suspended") {
          ctx
            .resume()
            .then(() => {
              played = true;
              setSoundPlayed(true);
              playSplashSound(ctx);
            })
            .catch(() => {
              /* blocked */
            });
        } else {
          played = true;
          setSoundPlayed(true);
          playSplashSound(ctx);
        }
      } catch {
        // not supported
      }
    };

    const handleInteraction = () => {
      tryPlay();
      document.removeEventListener("touchstart", handleInteraction);
      document.removeEventListener("click", handleInteraction);
    };

    // Try autoplay immediately
    tryPlay();

    // Fallback: first user interaction
    document.addEventListener("touchstart", handleInteraction, { once: true });
    document.addEventListener("click", handleInteraction, { once: true });

    return () => {
      document.removeEventListener("touchstart", handleInteraction);
      document.removeEventListener("click", handleInteraction);
    };
  }, []);

  // Particle canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      color: string;
    }[] = [];

    const colors = [
      "#4fc3f7",
      "#29b6f6",
      "#81d4fa",
      "#b3e5fc",
      "#e1f5fe",
      "#7c4dff",
      "#536dfe",
    ];

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        size: Math.random() * 2.5 + 0.5,
        alpha: Math.random() * 0.6 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const grad = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.8,
      );
      grad.addColorStop(0, "#0a1628");
      grad.addColorStop(0.5, "#060d1f");
      grad.addColorStop(1, "#020810");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const orb1 = ctx.createRadialGradient(
        canvas.width * 0.2,
        canvas.height * 0.3,
        0,
        canvas.width * 0.2,
        canvas.height * 0.3,
        200,
      );
      orb1.addColorStop(0, "rgba(41, 182, 246, 0.08)");
      orb1.addColorStop(1, "transparent");
      ctx.fillStyle = orb1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const orb2 = ctx.createRadialGradient(
        canvas.width * 0.8,
        canvas.height * 0.7,
        0,
        canvas.width * 0.8,
        canvas.height * 0.7,
        200,
      );
      orb2.addColorStop(0, "rgba(124, 77, 255, 0.08)");
      orb2.addColorStop(1, "transparent");
      ctx.fillStyle = orb2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 6;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Progress bar
  useEffect(() => {
    let current = 0;
    const total = 2400;
    const interval = 30;
    const step = (100 / total) * interval;

    const timer = setInterval(() => {
      current += step;
      if (current >= 100) {
        setProgress(100);
        clearInterval(timer);
        setTimeout(() => setPhase("flash"), 200);
        setTimeout(() => setPhase("done"), 800);
        setTimeout(() => onComplete(), 1000);
      } else {
        setProgress(current);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      style={{
        opacity: phase === "done" ? 0 : 1,
        transition: phase === "done" ? "opacity 0.5s ease-out" : undefined,
        pointerEvents: phase === "done" ? "none" : "all",
      }}
      data-ocid="splash.panel"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div
        className="absolute inset-0 bg-white pointer-events-none"
        style={{
          opacity: phase === "flash" ? 0.6 : 0,
          transition: "opacity 0.3s ease-out",
        }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        <div
          style={{
            animation:
              "splashZoomIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
            opacity: 0,
          }}
          className="flex flex-col items-center gap-4"
        >
          <div className="text-center">
            <h1
              className="text-4xl font-black tracking-widest uppercase"
              style={{
                color: "#fff",
                textShadow:
                  "0 0 30px rgba(41,182,246,0.9), 0 0 60px rgba(41,182,246,0.5), 0 0 100px rgba(41,182,246,0.3)",
                letterSpacing: "0.12em",
              }}
            >
              LIFE BATTLE
            </h1>
            <p
              className="text-lg font-bold tracking-[0.4em] uppercase mt-1"
              style={{
                color: "#7dd3fc",
                textShadow: "0 0 15px rgba(125,211,252,0.8)",
              }}
            >
              TOURNAMENT
            </p>
          </div>

          <div
            className="relative flex items-center justify-center my-2"
            style={{ width: 100, height: 100 }}
          >
            {SPARK_POSITIONS.map((s) => (
              <div
                key={s.id}
                className="absolute rounded-full"
                style={{
                  width: 4,
                  height: 4,
                  background: s.bg,
                  top: s.top,
                  left: s.left,
                  animation: s.anim,
                  boxShadow: "0 0 6px #ff9800, 0 0 12px #ff5722",
                }}
              />
            ))}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,100,0,0.25) 0%, transparent 70%)",
                animation: "vsPulse 1.2s ease-in-out infinite",
              }}
            />
            <span
              className="relative font-black text-4xl"
              style={{
                background:
                  "linear-gradient(180deg, #ffb300 0%, #ff5722 60%, #e53935 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter:
                  "drop-shadow(0 0 8px rgba(255,100,0,0.9)) drop-shadow(0 0 20px rgba(255,60,0,0.7))",
                letterSpacing: "0.05em",
              }}
            >
              VS
            </span>
          </div>

          <div
            className="w-48 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, #29b6f6, transparent)",
              boxShadow: "0 0 8px rgba(41,182,246,0.6)",
            }}
          />

          <p
            className="text-xs tracking-[0.3em] uppercase font-semibold"
            style={{ color: "rgba(125,211,252,0.6)" }}
          >
            Free Fire · Compete · Conquer
          </p>
        </div>

        {/* Sound hint — only show if sound hasn't played yet */}
        {!soundPlayed && (
          <p
            className="absolute top-6 right-6 text-sm font-black tracking-widest uppercase px-3 py-1.5 rounded-lg"
            style={{
              color: "#29b6f6",
              background: "rgba(41,182,246,0.15)",
              border: "1px solid rgba(41,182,246,0.35)",
              textShadow: "0 0 10px rgba(41,182,246,0.8)",
              animation: "splashFadeIn 1s ease-out 0.8s forwards",
              opacity: 0,
            }}
          >
            🔊 TAP FOR SOUND
          </p>
        )}

        <div
          className="mt-12 w-64"
          style={{
            animation: "splashFadeIn 0.5s ease-out 0.6s forwards",
            opacity: 0,
          }}
        >
          <div
            className="w-full rounded-full overflow-hidden"
            style={{
              height: 4,
              background: "rgba(255,255,255,0.08)",
              boxShadow: "0 0 8px rgba(41,182,246,0.2)",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "linear-gradient(90deg, #1565c0, #29b6f6, #7c4dff)",
                boxShadow:
                  "0 0 12px rgba(41,182,246,0.8), 0 0 24px rgba(41,182,246,0.4)",
                transition: "width 0.03s linear",
                borderRadius: "9999px",
              }}
            />
          </div>
          <p
            className="text-center mt-2 text-xs font-mono"
            style={{ color: "rgba(125,211,252,0.5)", letterSpacing: "0.1em" }}
          >
            LOADING {Math.round(progress)}%
          </p>
        </div>
      </div>

      <style>{`
        @keyframes splashZoomIn {
          0%   { opacity: 0; transform: scale(0.6); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes splashFadeIn {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes vsPulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50%       { transform: scale(1.15); opacity: 1; }
        }
        @keyframes sparkFloat {
          0%   { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(0, -6px) scale(0.7); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
