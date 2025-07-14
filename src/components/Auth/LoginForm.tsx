import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { User } from '../../types';
import { ErrorAlert } from '../UI/ErrorAlert';

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<User>;
  loading?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, loading = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const interBubbleRef = useRef<HTMLDivElement>(null);

  // Mouse tracking for interactive bubble
  useEffect(() => {
    const interBubble = interBubbleRef.current;
    if (!interBubble) return;

    let curX = 0;
    let curY = 0;
    let tgX = 0;
    let tgY = 0;

    function move() {
      if (!interBubble) return;
      curX += (tgX - curX) / 20;
      curY += (tgY - curY) / 20;
      interBubble.style.transform = `translate(${Math.round(curX)}px, ${Math.round(curY)}px)`;
      requestAnimationFrame(() => {
        move();
      });
    }

    const handleMouseMove = (event: MouseEvent) => {
      tgX = event.clientX;
      tgY = event.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);
    move();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בהתחברות');
    }
  };

  return (
    <div>
      {/* Animated Gradient Background */}
      <div 
        style={{
          width: '100vw',
          height: '100vh',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(40deg, rgb(108, 0, 162), rgb(0, 17, 82))',
          top: 0,
          left: 0,
        }}
      >
        {/* SVG Filter for Goo Effect */}
        <svg style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0 }}>
          <defs>
            <filter id="goo">
              <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
              <feColorMatrix
                in="blur"
                mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
                result="goo"
              />
              <feBlend in="SourceGraphic" in2="goo" />
            </filter>
          </defs>
        </svg>

        {/* Gradients Container */}
        <div 
          style={{
            filter: 'url(#goo) blur(40px)',
            width: '100%',
            height: '100%',
          }}
        >
          {/* Gradient Circle 1 */}
          <div
            style={{
              position: 'absolute',
              background: 'radial-gradient(circle at center, rgba(18, 113, 255, 0.8) 0%, rgba(18, 113, 255, 0) 50%) no-repeat',
              mixBlendMode: 'hard-light',
              width: '80%',
              height: '80%',
              top: 'calc(50% - 40%)',
              left: 'calc(50% - 40%)',
              transformOrigin: 'center center',
              animation: 'moveVertical 30s ease infinite',
              opacity: 1,
            }}
          />

          {/* Gradient Circle 2 */}
          <div
            style={{
              position: 'absolute',
              background: 'radial-gradient(circle at center, rgba(221, 74, 255, 0.8) 0%, rgba(221, 74, 255, 0) 50%) no-repeat',
              mixBlendMode: 'hard-light',
              width: '80%',
              height: '80%',
              top: 'calc(50% - 40%)',
              left: 'calc(50% - 40%)',
              transformOrigin: 'calc(50% - 400px)',
              animation: 'moveInCircle 20s reverse infinite',
              opacity: 1,
            }}
          />

          {/* Gradient Circle 3 */}
          <div
            style={{
              position: 'absolute',
              background: 'radial-gradient(circle at center, rgba(100, 220, 255, 0.8) 0%, rgba(100, 220, 255, 0) 50%) no-repeat',
              mixBlendMode: 'hard-light',
              width: '80%',
              height: '80%',
              top: 'calc(50% - 40% + 200px)',
              left: 'calc(50% - 40% - 500px)',
              transformOrigin: 'calc(50% + 400px)',
              animation: 'moveInCircle 40s linear infinite',
              opacity: 1,
            }}
          />

          {/* Gradient Circle 4 */}
          <div
            style={{
              position: 'absolute',
              background: 'radial-gradient(circle at center, rgba(200, 50, 50, 0.8) 0%, rgba(200, 50, 50, 0) 50%) no-repeat',
              mixBlendMode: 'hard-light',
              width: '80%',
              height: '80%',
              top: 'calc(50% - 40%)',
              left: 'calc(50% - 40%)',
              transformOrigin: 'calc(50% - 200px)',
              animation: 'moveHorizontal 40s ease infinite',
              opacity: 0.7,
            }}
          />

          {/* Gradient Circle 5 */}
          <div
            style={{
              position: 'absolute',
              background: 'radial-gradient(circle at center, rgba(180, 180, 50, 0.8) 0%, rgba(180, 180, 50, 0) 50%) no-repeat',
              mixBlendMode: 'hard-light',
              width: 'calc(80% * 2)',
              height: 'calc(80% * 2)',
              top: 'calc(50% - 80%)',
              left: 'calc(50% - 80%)',
              transformOrigin: 'calc(50% - 800px) calc(50% + 200px)',
              animation: 'moveInCircle 20s ease infinite',
              opacity: 1,
            }}
          />

          {/* Interactive Bubble */}
          <div
            ref={interBubbleRef}
            style={{
              position: 'absolute',
              background: 'radial-gradient(circle at center, rgba(140, 100, 255, 0.8) 0%, rgba(140, 100, 255, 0) 50%) no-repeat',
              mixBlendMode: 'hard-light',
              width: '100%',
              height: '100%',
              top: '-50%',
              left: '-50%',
              opacity: 0.7,
            }}
          />
        </div>

        {/* Login Form Container */}
        <div 
          style={{
            zIndex: 100,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            position: 'absolute',
            top: 0,
            left: 0,
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            fontFamily: 'Heebo, sans-serif',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full space-y-8"
          >
            {/* Logo and Title */}
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="mx-auto h-24 w-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-8 border-2 border-white/30 shadow-lg"
              >
                <span className="text-white text-3xl font-bold">WS</span>
              </motion.div>
              <h1 
                style={{
                  fontSize: '2.5rem',
                  color: 'white',
                  fontWeight: '700',
                  marginBottom: '12px',
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
                  lineHeight: '1.2',
                }}
              >
                ברוכים הבאים ל-WeSell
              </h1>
              <p 
                style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '1.1rem',
                  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.2)',
                  fontWeight: '500',
                }}
              >
                התחברו למערכת ניהול המכירות שלכם
              </p>
            </div>

            {/* Login Form */}
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="backdrop-blur-xl bg-white/15 border border-white/25 rounded-3xl p-8 space-y-6 shadow-2xl"
              onSubmit={handleSubmit}
            >
              <AnimatePresence>
                {error && (
                  <ErrorAlert message={error} type="error" />
                )}
              </AnimatePresence>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-white/95 mb-3">
                  כתובת אימייל
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-4 pr-12 rounded-xl backdrop-blur-sm bg-white/15 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200 font-medium"
                    placeholder="הכניסו את כתובת האימייל שלכם"
                    required
                  />
                  <Mail className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-white/95 mb-3">
                  סיסמה
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-4 pr-12 pl-12 rounded-xl backdrop-blur-sm bg-white/15 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200 font-medium"
                    placeholder="הכניסו את הסיסמה שלכם"
                    required
                  />
                  <Lock className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white/90 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                type="submit"
                disabled={loading}
                className={`w-full py-4 text-lg font-bold rounded-xl backdrop-blur-sm border shadow-lg mt-6 transition-all duration-300 ${
                  loading 
                    ? 'bg-white/30 border-white/50 cursor-not-allowed' 
                    : 'bg-white/25 border-white/40 text-white hover:bg-white/35'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-4 rtl:space-x-reverse">
                    {/* Ultra-Modern Morphing Loader */}
                    <div className="relative">
                      {/* Outer pulsing ring */}
                      <div 
                        className="w-8 h-8 border border-white/20 rounded-full"
                        style={{
                          animation: 'pulseRing 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite'
                        }}
                      ></div>
                      
                      {/* Rotating gradient border */}
                      <div 
                        className="absolute top-0 left-0 w-8 h-8 rounded-full"
                        style={{
                          background: 'conic-gradient(from 0deg, transparent 70%, rgba(255,255,255,0.8) 100%)',
                          animation: 'rotateLoader 1.2s linear infinite',
                          mask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 2px))',
                          WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 2px))'
                        }}
                      ></div>
                      
                      {/* Inner morphing core */}
                      <div 
                        className="absolute top-2 left-2 w-4 h-4 bg-white rounded-full"
                        style={{
                          animation: 'morphCore 2s ease-in-out infinite'
                        }}
                      ></div>
                      
                      {/* Floating particles */}
                      <div 
                        className="absolute top-1 left-1 w-1 h-1 bg-white rounded-full"
                        style={{
                          animation: 'floatParticle1 3s ease-in-out infinite'
                        }}
                      ></div>
                      <div 
                        className="absolute bottom-1 right-1 w-1 h-1 bg-white rounded-full"
                        style={{
                          animation: 'floatParticle2 3s ease-in-out infinite 1.5s'
                        }}
                      ></div>
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <span className="text-white font-medium tracking-wide text-lg">מתחבר</span>
                      <div className="flex space-x-1 mt-1">
                        <div 
                          className="w-1 h-1 bg-white rounded-full"
                          style={{ animation: 'textDots 1.5s ease-in-out infinite 0s' }}
                        ></div>
                        <div 
                          className="w-1 h-1 bg-white rounded-full"
                          style={{ animation: 'textDots 1.5s ease-in-out infinite 0.5s' }}
                        ></div>
                        <div 
                          className="w-1 h-1 bg-white rounded-full"
                          style={{ animation: 'textDots 1.5s ease-in-out infinite 1s' }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  'התחבר'
                )}
              </motion.button>

            </motion.form>
          </motion.div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes moveInCircle {
          0% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(180deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes moveVertical {
          0% {
            transform: translateY(-50%);
          }
          50% {
            transform: translateY(50%);
          }
          100% {
            transform: translateY(-50%);
          }
        }

        @keyframes moveHorizontal {
          0% {
            transform: translateX(-50%) translateY(-10%);
          }
          50% {
            transform: translateX(50%) translateY(10%);
          }
          100% {
            transform: translateX(-50%) translateY(-10%);
          }
        }

        @keyframes modernLoader {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1.2);
            opacity: 1;
          }
        }

        @keyframes pulseRing {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.3;
          }
          100% {
            transform: scale(0.8);
            opacity: 1;
          }
        }

        @keyframes rotateLoader {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes innerPulse {
          0%, 100% {
            transform: scale(0.6);
            opacity: 0.7;
          }
          50% {
            transform: scale(0.9);
            opacity: 0.3;
          }
        }

        @keyframes morphCore {
          0%, 100% {
            transform: scale(1);
            opacity: 0.8;
            border-radius: 50%;
          }
          25% {
            transform: scale(1.2);
            opacity: 0.6;
            border-radius: 30%;
          }
          50% {
            transform: scale(0.8);
            opacity: 1;
            border-radius: 50%;
          }
          75% {
            transform: scale(1.1);
            opacity: 0.7;
            border-radius: 20%;
          }
        }

        @keyframes floatParticle1 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.5;
          }
          33% {
            transform: translate(10px, -8px) scale(1.2);
            opacity: 1;
          }
          66% {
            transform: translate(-5px, 10px) scale(0.8);
            opacity: 0.7;
          }
        }

        @keyframes floatParticle2 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.5;
          }
          33% {
            transform: translate(-8px, -10px) scale(1.3);
            opacity: 1;
          }
          66% {
            transform: translate(12px, 5px) scale(0.9);
            opacity: 0.6;
          }
        }

        @keyframes textDots {
          0%, 80%, 100% {
            transform: scale(1);
            opacity: 0.5;
          }
          40% {
            transform: scale(1.5);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};