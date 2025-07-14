import React from 'react';
import { motion } from 'framer-motion';

export const PageLoader: React.FC = () => {
  return (
    <div 
      style={{
        width: '100vw',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999,
        background: 'linear-gradient(135deg, rgb(108, 0, 162), rgb(0, 17, 82), rgb(18, 113, 255))',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Heebo, sans-serif',
      }}
    >
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Main Loading Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        {/* Logo Container */}
        <motion.div
          className="relative mb-12"
          animate={{ 
            rotateY: [0, 360],
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {/* Outer Ring with motion animation */}
          <motion.div 
            className="w-24 h-24 border-2 border-white/30 rounded-full absolute"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: [0.68, -0.55, 0.265, 1.55],
            }}
          />
          
          {/* Middle Ring with motion animation */}
          <motion.div 
            className="w-20 h-20 border border-white/40 rounded-full absolute top-2 left-2"
            animate={{
              scale: [1.1, 1, 1.1],
              opacity: [1, 0.7, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: [0.68, -0.55, 0.265, 1.55],
            }}
          />
          
          {/* Rotating Gradient Ring */}
          <motion.div 
            className="w-24 h-24 rounded-full absolute"
            style={{
              background: 'conic-gradient(from 0deg, transparent 60%, rgba(255,255,255,0.8) 100%)',
              mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 3px))',
              WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 3px))'
            }}
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          
          {/* Inner Logo */}
          <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/30">
            <motion.span 
              className="text-white text-2xl font-bold"
              style={{
                textShadow: '0 0 10px rgba(255,255,255,0.5)',
              }}
              animate={{ 
                textShadow: [
                  '0 0 5px rgba(255,255,255,0.5)',
                  '0 0 20px rgba(255,255,255,0.8)',
                  '0 0 5px rgba(255,255,255,0.5)'
                ]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              WS
            </motion.span>
          </div>
        </motion.div>

        {/* Loading Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold text-white mb-4 tracking-wide">
            WeSell
          </h1>
          
          <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
            <span className="text-white/90 text-lg font-medium">טוען</span>
            <div className="flex space-x-1 rtl:space-x-reverse">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-white rounded-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Progress Elements */}
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: '200px' }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-8"
        >
          {/* Animated Progress Bar */}
          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-white/60 to-white rounded-full"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
          
          {/* Loading Steps */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="text-center mt-4"
          >
            <motion.span 
              className="text-white/70 text-sm"
              animate={{
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            >
              מתחבר לשרת • טוען נתונים • מכין הממשק
            </motion.span>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}; 