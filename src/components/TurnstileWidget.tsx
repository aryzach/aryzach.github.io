import { Turnstile, TurnstileInstance } from '@marsidev/react-turnstile';
import { forwardRef, useImperativeHandle, useRef } from 'react';

export interface TurnstileWidgetRef {
  execute: () => void;
  reset: () => void;
}

interface TurnstileWidgetProps {
  onSuccess: (token: string) => void;
}

export const TurnstileWidget = forwardRef<TurnstileWidgetRef, TurnstileWidgetProps>(
  ({ onSuccess }, ref) => {
    const turnstileRef = useRef<TurnstileInstance>(null);

    useImperativeHandle(ref, () => ({
      execute: () => {
        turnstileRef.current?.execute();
      },
      reset: () => {
        turnstileRef.current?.reset();
      },
    }));

    return (
      <Turnstile
        ref={turnstileRef}
        siteKey="0x4AAAAAACFs3jTy8S0VihmG"
        options={{ 
          theme: 'light',
          size: 'invisible'
        }}
        onSuccess={onSuccess}
      />
    );
  }
);

TurnstileWidget.displayName = 'TurnstileWidget';
