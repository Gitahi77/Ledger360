'use client';
import * as React from 'react';
import { DesignTokensInspector } from '../../_components/DesignTokensInspector';

export default function MotionFoundationPage() {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setIsLoading((prev) => !prev);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-16">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Motion Language</h1>
        <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
          The Arc restraint. Motion is a first-class design asset used to teach, reward, and communicate state. It must never exceed 300ms and must respect reduced motion preferences.
        </p>
      </div>

      <div className="space-y-8">
        {/* Hover (Teaching) */}
        <DesignTokensInspector
          title="Hover (Teaching)"
          category="Motion / Interaction"
          tokens={[
            { label: 'CSS Variable', value: 'var(--duration-fast)' },
            { label: 'Timing', value: '150ms' },
            { label: 'Easing', value: 'ease-out' },
            { label: 'Purpose', value: 'Teaches the user that an element is an entry point without distracting from narrative.' },
          ]}
        >
          <div className="w-32 h-16 bg-card border rounded-xl flex items-center justify-center cursor-pointer transition-all duration-150 ease-out hover:-translate-y-1 hover:shadow-lg hover:border-primary/20">
            <span className="text-sm font-medium">Hover me</span>
          </div>
        </DesignTokensInspector>

        {/* Press (Reward) */}
        <DesignTokensInspector
          title="Press (Reward)"
          category="Motion / Interaction"
          tokens={[
            { label: 'CSS Variable', value: 'var(--duration-fast)' },
            { label: 'Timing', value: '150ms' },
            { label: 'Easing', value: 'cubic-bezier(0.4, 0, 0.2, 1)' },
            { label: 'Transform', value: 'scale(0.96)' },
            { label: 'Purpose', value: 'Every button and pill must explicitly reward interaction using a microscopic scale transform.' },
          ]}
        >
          <button className="px-6 py-2 bg-primary text-primary-foreground rounded-full font-medium transition-transform duration-150 active:scale-95">
            Press me
          </button>
        </DesignTokensInspector>

        {/* Expand (Structural) */}
        <DesignTokensInspector
          title="Expand (Structural)"
          category="Motion / Structural"
          tokens={[
            { label: 'CSS Variable', value: 'var(--duration-normal)' },
            { label: 'Timing', value: '300ms' },
            { label: 'Easing', value: 'cubic-bezier(0.175, 0.885, 0.32, 1.1)' },
            { label: 'Purpose', value: 'Used when elements change size or reveal content. Uses subtle spring physics.' },
          ]}
        >
          <div 
            className="w-full max-w-sm bg-card border rounded-xl overflow-hidden cursor-pointer transition-all duration-300"
            style={{ height: isExpanded ? '120px' : '48px', transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.1)' }}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="h-12 px-4 flex items-center justify-between border-b">
              <span className="text-sm font-medium">Click to expand</span>
              <span className={`text-xs transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
            </div>
            <div className="p-4 text-sm text-muted-foreground">
              This content expands smoothly using a spring curve.
            </div>
          </div>
        </DesignTokensInspector>

        {/* Fade (Appearance) */}
        <DesignTokensInspector
          title="Fade (Appearance)"
          category="Motion / Transition"
          tokens={[
            { label: 'CSS Variable', value: 'var(--duration-slow)' },
            { label: 'Timing', value: '500ms' },
            { label: 'Easing', value: 'ease-in-out' },
            { label: 'Purpose', value: 'Used for Hero numbers and initial page loads to ease the eye in.' },
          ]}
        >
          <div className="flex gap-4">
            <div className="w-16 h-16 bg-primary/20 rounded-xl animate-fade-in" style={{ animationDuration: '500ms' }} />
            <div className="w-16 h-16 bg-primary/40 rounded-xl animate-fade-in" style={{ animationDuration: '500ms', animationDelay: '100ms', animationFillMode: 'both' }} />
            <div className="w-16 h-16 bg-primary/60 rounded-xl animate-fade-in" style={{ animationDuration: '500ms', animationDelay: '200ms', animationFillMode: 'both' }} />
          </div>
        </DesignTokensInspector>

        {/* Skeleton (Loading) */}
        <DesignTokensInspector
          title="Skeleton (Loading)"
          category="Motion / Lifecycle"
          tokens={[
            { label: 'Animation', value: 'pulse' },
            { label: 'Purpose', value: 'The layout loads immediately with skeleton blocks matching exact typography height, preventing CLS.' },
          ]}
        >
          <div className="w-full max-w-xs space-y-3">
            {isLoading ? (
              <>
                <div className="h-6 bg-muted rounded animate-pulse w-3/4" />
                <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
              </>
            ) : (
              <>
                <div className="h-6 flex items-center text-lg font-semibold">Content loaded</div>
                <div className="h-4 flex items-center text-sm text-muted-foreground">No layout shift occurred.</div>
              </>
            )}
          </div>
        </DesignTokensInspector>

        {/* Reduced Motion */}
        <DesignTokensInspector
          title="Reduced Motion (A11y)"
          category="Motion / Accessibility"
          tokens={[
            { label: 'Media Query', value: '@media (prefers-reduced-motion: reduce)' },
            { label: 'Action', value: 'transition: none; animation: none;' },
            { label: 'Purpose', value: 'Respects OS-level accessibility settings. Motion is an enhancement, not a requirement.' },
          ]}
        />
      </div>
    </div>
  );
}
