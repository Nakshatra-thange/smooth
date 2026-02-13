import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Heart, Send, Clock } from 'lucide-react';

// ── import wallet adapter default styles (required for the modal to show) ────
import '@solana/wallet-adapter-react-ui/styles.css';

// ── keep Lovable's existing decorative components unchanged ──────────────────

const FloatingHearts = () => {
  const hearts = Array.from({ length: 40 }, (_, i) => {
    const symbols = [ '🎀', '♡', '🎀', '♥', '✿', '♡', '🎀'];
    const symbol = symbols[i % symbols.length];
    const size = 12 + Math.random() * 20;
    const left = Math.random() * 100;
    const delay = Math.random() * 12;
    const duration = 10 + Math.random() * 14;
    const colors = [
      'hsl(330, 58%, 91%)',
      'hsl(340, 40%, 80%)',
      'hsl(345, 40%, 69%)',
      'hsl(348, 32%, 48%)',
    ];
    const color = colors[i % colors.length];
    return (
      <span
        key={i}
        className="floating-symbol"
        style={{
          position: 'absolute',
          left: `${left}%`,
          bottom: `-${size}px`,
          fontSize: `${size}px`,
          color,
          opacity: 0.35 + Math.random() * 0.3,
          animationDelay: `${delay}s`,
          animationDuration: `${duration}s`,
          pointerEvents: 'none',
        }}
      >
        {symbol}
      </span>
    );
  });
  return <div className="absolute inset-0 overflow-hidden z-0">{hearts}</div>;
};

const MagneticLine = ({ children, delay }: { children: string; delay: number }) => {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * 0.04;
      const dy = (e.clientY - cy) * 0.06;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    };
    const handleLeave = () => {
      el.style.transform = 'translate(0,0)';
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseleave', handleLeave);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseleave', handleLeave);
    };
  }, []);

  return (
    <p
      ref={ref}
      className="text-xl md:text-2xl text-ruby-petals font-semibold text-bubbly tagline-pop"
      style={{
        animationDelay: `${delay}s`,
        transition: 'transform 0.3s cubic-bezier(.25,.46,.45,.94)',
        fontFamily: "'Playfair Display', serif",
        fontStyle: 'italic',
      }}
    >
      {children}
    </p>
  );
};

const FeatureCard = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div className="bg-white/60 backdrop-blur-sm border border-bubblegum/40 rounded-3xl p-8 flex flex-col items-center gap-4 hover:border-cherry-soda/50 hover:glow-pink transition-all duration-300 cursor-pointer group">
    <div className="w-16 h-16 rounded-full bg-pink-mist flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
      {icon}
    </div>
    <p className="text-ruby-petals text-sm font-medium text-bubbly text-center">{text}</p>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────

const LandingPage = () => {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const navigate = useNavigate();

  // If wallet is already connected (e.g. autoConnect on refresh), go straight to app
  useEffect(() => {
    if (connected) {
      navigate('/app', { replace: true });
    }
  }, [connected]);

  // Both buttons call this — opens the Phantom/Backpack/Solflare picker modal
  function handleConnectClick() {
    setVisible(true);
  }

  return (
    <div className="min-h-screen bg-pink-mist relative overflow-hidden">
      <FloatingHearts />

      {/* Animated background blobs */}
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-bubblegum/30 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
      <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-cherry-soda/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
      <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-ruby-petals/10 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold gradient-text tracking-tight">SMOOTH</h1>

        {/* "Launch App" → opens wallet modal */}
        <button
          onClick={handleConnectClick}
          className="px-6 py-2.5 rounded-2xl border-2 border-cherry-soda text-ruby-petals font-semibold text-sm hover:bg-cherry-soda hover:text-white transition-all duration-300 hover:shadow-[0_0_24px_rgba(211,140,157,0.4)] hover:scale-105"
        >
          Launch App
        </button>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center text-center px-6 pt-16 pb-12 max-w-3xl mx-auto">
        <h2 className="text-5xl md:text-7xl font-extrabold gradient-text mb-10 tracking-tight text-bubbly animate-fade-in">
          SMOOTH
        </h2>

        <div className="space-y-3 mb-12">
          <MagneticLine delay={0.1}>Just say &ldquo;Abra Sol Dabra.&rdquo;</MagneticLine>
          <MagneticLine delay={0.25}>Silky transactions with Zero clicks.</MagneticLine>
          <MagneticLine delay={0.4}>Talk is action. On Solana.</MagneticLine>
        </div>

        {/* "Connect Your Wallet" → opens wallet modal */}
        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <button
            onClick={handleConnectClick}
            className="inline-block px-12 py-4 rounded-2xl gradient-pink text-white font-semibold text-lg glow-pink-strong hover:scale-105 transition-transform duration-200 text-bubbly"
          >
            Connect Your Wallet
          </button>
        </div>

        {/* Feature Cards — unchanged */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <FeatureCard icon={<Heart className="w-8 h-8 text-cherry-soda" />} text="What's my balance right now?" />
          <FeatureCard icon={<Send className="w-8 h-8 text-cherry-soda" />} text="Send 0.5 SOL to my friend Alice" />
          <FeatureCard icon={<Clock className="w-8 h-8 text-cherry-soda" />} text="Show my last 10 transactions" />
        </div>

        <div className="mt-20 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <p className="text-lg md:text-xl text-ruby-petals font-bold text-bubbly tracking-wide" style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}>
            Abra Sol Dabra — now live on Smooth
          </p>
        </div>
      </main>

      {/* Footer — unchanged */}
      <footer className="relative z-10 text-center py-8 border-t border-bubblegum/30">
        <p className="text-xs text-ruby-petals/40 text-bubbly">
          © 2026 Private
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;