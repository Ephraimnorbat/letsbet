import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  blur?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  blur = true,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${blur ? 'backdrop-blur-sm' : ''}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <Loader2 className={`${sizeClasses[size]} text-blue-500`} />
      </motion.div>
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-gray-600 dark:text-gray-400"
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};

interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
  children: React.ReactNode;
  iOSStyle?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  text = 'Loading...',
  children,
  iOSStyle = true,
}) => {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20"
          >
            {iOSStyle ? (
              <div className="flex flex-col items-center gap-4">
                {/* iOS-style activity indicator */}
                <div className="relative">
                  <div className="w-12 h-12">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
                      <motion.div
                        key={i}
                        className="absolute top-1/2 left-1/2 w-1 h-4 bg-blue-500 rounded-full origin-bottom"
                        style={{
                          transform: `translate(-50%, -100%) rotate(${i * 30}deg) translateY(-12px)`,
                        }}
                        animate={{
                          opacity: [0.3, 1, 0.3],
                          scale: [0.8, 1, 0.8],
                        }}
                        transition={{
                          duration: 1.2,
                          repeat: Infinity,
                          delay: i * 0.1,
                          ease: 'easeInOut',
                        }}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="text-center">
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-gray-900 dark:text-white font-medium text-lg"
                  >
                    {text}
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-gray-600 dark:text-gray-400 text-sm mt-1"
                  >
                    Please wait a moment...
                  </motion.p>
                </div>
              </div>
            ) : (
              <LoadingSpinner size="lg" text={text} />
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

// iOS-style loading spinner component
export const iOSActivityIndicator: React.FC<{
  size?: number;
  color?: string;
}> = ({ size = 12, color = '#007AFF' }) => {
  const bars = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className="relative" style={{ width: size * 2, height: size * 2 }}>
      {bars.map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 2,
            height: size / 3,
            backgroundColor: color,
            top: '50%',
            left: '50%',
            transformOrigin: 'center bottom',
            transform: `translate(-50%, -100%) rotate(${i * 30}deg) translateY(-${size / 2}px)`,
          }}
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

// Full-screen loading overlay with iOS style
export const FullScreenLoading: React.FC<{
  isLoading: boolean;
  text?: string;
  subtext?: string;
}> = ({ isLoading, text = 'Loading', subtext = 'Please wait...' }) => {
  if (!isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-white/30 max-w-sm mx-4"
      >
        <div className="flex flex-col items-center gap-6">
          <iOSActivityIndicator size={16} />
          
          <div className="text-center space-y-2">
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-gray-900 dark:text-white font-semibold text-xl"
            >
              {text}
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-gray-600 dark:text-gray-400 text-base"
            >
              {subtext}
            </motion.p>
          </div>
          
          {/* Progress dots */}
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-blue-500 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LoadingSpinner;
