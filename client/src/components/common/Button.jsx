import React from 'react';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: `
    bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold 
    shadow-xs shadow-indigo-600/20 hover:shadow-sm hover:shadow-indigo-600/30 
    border border-transparent dark:bg-indigo-500 dark:hover:bg-indigo-600
  `,
  secondary: `
    bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-medium 
    border border-slate-200/90 shadow-xs hover:border-slate-300
    dark:bg-[#171A1F] dark:hover:bg-[#1E232B] dark:text-slate-200 dark:border-white/[0.08] dark:hover:border-white/[0.14]
  `,
  tertiary: `
    bg-slate-100/80 hover:bg-slate-200/80 active:bg-slate-300/80 text-slate-700 font-medium
    border border-transparent
    dark:bg-[#1F242C] dark:hover:bg-[#282F3A] dark:text-slate-300
  `,
  destructive: `
    bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-semibold
    shadow-xs shadow-rose-600/20 border border-transparent
    dark:bg-rose-600 dark:hover:bg-rose-700
  `,
  ghost: `
    bg-transparent hover:bg-slate-100 active:bg-slate-200/70 text-slate-600 hover:text-slate-900 font-medium
    dark:hover:bg-white/[0.06] dark:text-slate-400 dark:hover:text-slate-100
  `
};

const SIZES = {
  xs: 'px-2 py-1 text-[11px] rounded-lg gap-1',
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-3.5 py-2 text-xs sm:text-sm rounded-xl gap-2',
  lg: 'px-5 py-2.5 text-sm sm:text-base rounded-xl gap-2.5',
};

const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  type = 'button',
  onClick,
  ...props
}, ref) => {
  const isDisabled = disabled || isLoading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      onClick={isDisabled ? undefined : onClick}
      className={`
        inline-flex items-center justify-center transition-all duration-150 select-none
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#111418]
        ${VARIANTS[variant] || VARIANTS.primary}
        ${SIZES[size] || SIZES.md}
        ${isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer active:scale-[0.98]'}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          <span>{typeof children === 'string' ? children : 'Loading...'}</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-3.5 h-3.5 shrink-0" />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className="w-3.5 h-3.5 shrink-0" />}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
