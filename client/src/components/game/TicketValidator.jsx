import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Sparkles, PartyPopper, Ticket } from 'lucide-react';
import { clsx } from 'clsx';
import Button from '../common/Button';
import useGameStore from '../../store/gameStore';
import Confetti from './Confetti';

export default function TicketValidator() {
  const [code, setCode] = useState('');
  const [step, setStep] = useState('input'); // input, validating, won
  const { validateTicket, currentWin, isValidating, error, clearError, clearCurrentWin } = useGameStore();

  const handleCodeChange = (e) => {
    // Format: majuscules, max 10 caractères, alphanumériques uniquement
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    setCode(value);
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (code.length !== 10) return;

    setStep('validating');
    const result = await validateTicket(code);

    if (result.success) {
      setStep('won');
    } else {
      setStep('input');
    }
  };

  const handleReset = () => {
    setCode('');
    setStep('input');
    clearCurrentWin();
    clearError();
  };

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {/* Étape 1: Saisie du code */}
        {step === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 mb-6 shadow-gold">
                <Ticket className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-tea-900 mb-2">
                Entrez votre code
              </h2>
              <p className="text-tea-600">
                Saisissez le code à 10 caractères présent sur votre ticket de caisse
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <input
                  type="text"
                  value={code}
                  onChange={handleCodeChange}
                  placeholder="XXXXXXXXXX"
                  className={clsx(
                    'w-full px-6 py-5 text-center text-2xl md:text-3xl font-mono tracking-[0.3em] rounded-2xl border-3',
                    'bg-cream-50 transition-all duration-200',
                    'focus:outline-none focus:ring-4',
                    error
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                      : 'border-cream-300 focus:border-matcha-400 focus:ring-matcha-100'
                  )}
                  maxLength={10}
                  autoComplete="off"
                  autoFocus
                />
                
                {/* Progress indicator */}
                <div className="absolute -bottom-6 left-0 right-0 flex justify-center gap-1">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className={clsx(
                        'w-2 h-2 rounded-full transition-colors',
                        i < code.length ? 'bg-matcha-500' : 'bg-cream-300'
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Error message */}
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-center font-medium"
                >
                  {error}
                </motion.p>
              )}

              <Button
                type="submit"
                variant="gold"
                size="lg"
                className="w-full text-lg"
                disabled={code.length !== 10}
                leftIcon={<Sparkles className="w-5 h-5" />}
              >
                Valider mon code
              </Button>
            </form>

            <p className="text-center text-sm text-tea-500">
              Vous trouverez ce code sur votre ticket de caisse pour tout achat supérieur à 49€
            </p>
          </motion.div>
        )}

        {/* Étape 2: Validation en cours */}
        {step === 'validating' && (
          <motion.div
            key="validating"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center py-12"
          >
            <div className="relative w-32 h-32 mx-auto mb-8">
              {/* Rotating ring */}
              <div className="absolute inset-0 border-4 border-gold-200 rounded-full" />
              <div className="absolute inset-0 border-4 border-transparent border-t-gold-500 rounded-full animate-spin" />
              
              {/* Center icon */}
              <div className="absolute inset-4 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center">
                <Gift className="w-12 h-12 text-white animate-pulse" />
              </div>
            </div>
            
            <h2 className="text-2xl font-display font-bold text-tea-900 mb-2">
              Validation en cours...
            </h2>
            <p className="text-tea-600">
              Nous vérifions votre code, un instant...
            </p>
          </motion.div>
        )}

        {/* Étape 3: Gain révélé */}
        {step === 'won' && currentWin && (
          <motion.div
            key="won"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <Confetti />
            
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', duration: 0.8, bounce: 0.4 }}
              className="relative mb-8"
            >
              <div className="w-40 h-40 mx-auto relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gold-400 rounded-full blur-2xl opacity-30 animate-pulse" />
                
                {/* Main circle */}
                <div className="relative w-full h-full rounded-full bg-gradient-to-br from-gold-400 via-gold-500 to-gold-600 flex items-center justify-center shadow-gold">
                  <PartyPopper className="w-20 h-20 text-white" />
                </div>
                
                {/* Sparkles */}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-matcha-500 rounded-full flex items-center justify-center animate-bounce">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-3xl md:text-4xl font-display font-bold text-tea-900 mb-4">
                🎉 Félicitations !
              </h2>
              <p className="text-lg text-tea-600 mb-6">
                Vous avez gagné :
              </p>
              
              {/* Prize card */}
              <div className="bg-gradient-to-br from-cream-50 to-gold-50 rounded-2xl p-6 mb-8 border-2 border-gold-200">
                <div className="text-4xl mb-4">🎁</div>
                <h3 className="text-2xl font-display font-bold text-tea-900 mb-2">
                  {currentWin.prize.name}
                </h3>
                <p className="text-tea-600">
                  {currentWin.prize.description}
                </p>
                <div className="mt-4 inline-flex items-center px-4 py-2 bg-gold-100 rounded-full text-gold-700 font-medium">
                  Valeur : {currentWin.prize.value}€
                </div>
              </div>

              <p className="text-tea-600 mb-6">
                Code du ticket : <span className="font-mono font-bold">{currentWin.ticketCode}</span>
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={handleReset} variant="primary">
                  Valider un autre code
                </Button>
                <Button onClick={() => window.location.href = '/dashboard'} variant="secondary">
                  Voir mes gains
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
