import React from 'react';
import { Logo } from './Logo';
import { Sparkles, Zap, BookOpen, ArrowRight } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const STEPS = [
  {
    icon: <Sparkles />,
    title: 'Welcome to Promnexa',
    description: 'Turn your ideas into powerful, well-structured AI prompts. No prompt engineering expertise required.',
  },
  {
    icon: <Zap />,
    title: 'Smart Optimization',
    description: 'Just type what you need. Promnexa automatically detects the category and optimizes your prompt for the best results.',
  },
  {
    icon: <BookOpen />,
    title: 'Prompt Library',
    description: 'Browse 30+ curated templates for education, coding, learning, daily life, and more. Save your favorites for quick access.',
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
