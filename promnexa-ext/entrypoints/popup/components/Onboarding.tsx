import React from 'react';
import { Logo } from './Logo';
import { Sparkles, BookOpen, ArrowRight, ShieldCheck, MessageSquare } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const STEPS = [
  {
    icon: <Sparkles />,
    title: 'Welcome to Promnexa',
    description: 'Turn your ideas into powerful, well-structured AI prompts for ChatGPT, Claude, Gemini, DeepSeek, and more.',
  },
  {
    icon: <MessageSquare />,
    title: 'In-Page AI Assistant',
    description: 'A floating magic button appears on ChatGPT, Claude & Gemini. Click Improve prompt to replace your draft in the chat box. Review it before sending, or use Undo to restore it.',
  },
  {
    icon: <BookOpen />,
    title: '200+ Built-in and Imported Templates',
    description: 'Explore 200+ templates for coding, education, writing, research, and business. Save your favorites for instant access.',
  },
  {
    icon: <ShieldCheck />,
    title: '100% Private & Shortcut Ready',
    description: 'Works offline with zero tracking. Press Ctrl+Shift+P (or Cmd+Shift+P on Mac) anytime to open Promnexa.',
  },
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = React.useState(0);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const currentStep = STEPS[step] ?? STEPS[0]!;

  return (
    <div className="onboarding">
      <div className="onboarding__step" key={step}>
        {step === 0 ? (
          <div className="onboarding__icon">
            <Logo size={40} />
          </div>
        ) : (
          <div className="onboarding__icon">
            {currentStep.icon}
          </div>
        )}

        <h1 className="onboarding__title">{currentStep.title}</h1>
        <p className="onboarding__desc">{currentStep.description}</p>

        <div className="onboarding__dots">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`onboarding__dot ${i === step ? 'onboarding__dot--active' : ''}`}
            />
          ))}
        </div>

        <button className="btn-primary" onClick={handleNext} style={{ maxWidth: '240px' }}>
          {step < STEPS.length - 1 ? (
            <>Continue <ArrowRight /></>
          ) : (
            <>Get Started <Sparkles /></>
          )}
        </button>

        {step < STEPS.length - 1 && (
          <button
            className="clear-btn"
            onClick={handleSkip}
            style={{ marginTop: '12px', padding: '8px 16px' }}
          >
            Skip introduction
          </button>
        )}
      </div>
    </div>
  );
};
