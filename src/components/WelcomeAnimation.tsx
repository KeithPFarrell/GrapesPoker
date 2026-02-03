import { useEffect, useState } from 'react';

interface WelcomeAnimationProps {
  onComplete: () => void;
}

const suits = ['♠', '♥', '♦', '♣'];
const cards = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// Royal Flush in Hearts: 10, J, Q, K, A
const royalFlush = [
  { value: '10', suit: '♥', color: 'text-red-600' },
  { value: 'J', suit: '♥', color: 'text-red-600' },
  { value: 'Q', suit: '♥', color: 'text-red-600' },
  { value: 'K', suit: '♥', color: 'text-red-600' },
  { value: 'A', suit: '♥', color: 'text-red-600' },
];

export default function WelcomeAnimation({ onComplete }: WelcomeAnimationProps) {
  const [phase, setPhase] = useState<'flying' | 'royal-flush' | 'complete'>('flying');
  const [flyingCards, setFlyingCards] = useState<Array<{
    value: string;
    suit: string;
    color: string;
    delay: number;
  }>>([]);

  useEffect(() => {
    // Generate random flying cards
    const randomCards = Array.from({ length: 20 }, () => {
      const suit = suits[Math.floor(Math.random() * suits.length)];
      const value = cards[Math.floor(Math.random() * cards.length)];
      const color = suit === '♥' || suit === '♦' ? 'text-red-600' : 'text-black';
      return {
        value,
        suit,
        color,
        delay: Math.random() * 0.5,
      };
    });
    setFlyingCards(randomCards);

    // Transition to royal flush after 2 seconds
    const timer1 = setTimeout(() => {
      setPhase('royal-flush');
    }, 2000);

    // Complete animation after 5 seconds
    const timer2 = setTimeout(() => {
      setPhase('complete');
      onComplete();
    }, 5000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-poker-green via-poker-green-dark to-black flex items-center justify-center overflow-hidden z-50">
      {/* Flying cards phase */}
      {phase === 'flying' && (
        <div className="absolute inset-0">
          {flyingCards.map((card, index) => (
            <div
              key={index}
              className="absolute animate-fly-in"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${card.delay}s`,
              }}
            >
              <div className="bg-white rounded-lg shadow-2xl p-4 w-16 h-24 flex flex-col items-center justify-between border-2 border-gray-300">
                <span className={`text-2xl font-bold ${card.color}`}>{card.value}</span>
                <span className={`text-4xl ${card.color}`}>{card.suit}</span>
                <span className={`text-2xl font-bold ${card.color}`}>{card.value}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Royal Flush display */}
      {phase === 'royal-flush' && (
        <div className="flex flex-col items-center gap-8 animate-fade-in">
          <div className="flex gap-2 sm:gap-4">
            {royalFlush.map((card, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-2xl p-3 sm:p-6 w-16 h-24 sm:w-24 sm:h-36 flex flex-col items-center justify-between border-4 border-poker-gold animate-pulse-glow transform hover:scale-110 transition-transform"
                style={{
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                <span className={`text-xl sm:text-3xl font-bold ${card.color}`}>
                  {card.value}
                </span>
                <span className={`text-3xl sm:text-5xl ${card.color}`}>
                  {card.suit}
                </span>
                <span className={`text-xl sm:text-3xl font-bold ${card.color}`}>
                  {card.value}
                </span>
              </div>
            ))}
          </div>

          <div className="text-center space-y-4 animate-float">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white drop-shadow-2xl">
              Welcome to the
            </h1>
            <h2 className="text-4xl sm:text-6xl md:text-7xl font-bold text-poker-gold drop-shadow-2xl animate-pulse">
              Grapes Poker League
            </h2>
            <div className="flex items-center justify-center gap-2 text-2xl sm:text-3xl text-poker-gold">
              <span>♠</span>
              <span>♥</span>
              <span>♦</span>
              <span>♣</span>
            </div>
          </div>
        </div>
      )}

      {/* Loading indicator during transition */}
      {phase === 'complete' && (
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-poker-gold border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white text-xl">Loading Dashboard...</p>
        </div>
      )}
    </div>
  );
}
