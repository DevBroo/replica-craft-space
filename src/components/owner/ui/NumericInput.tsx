import * as React from 'react';
import { cn } from '@/lib/utils';

export interface NumericInputProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  ({ value, onValueChange, min = 0, max, step = 0.01, placeholder = "0", className, disabled, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState<string>(value.toString());
    const [isFocused, setIsFocused] = React.useState(false);

    // Sync internal value with external value when not focused
    React.useEffect(() => {
      if (!isFocused) {
        setInternalValue(value.toString());
      }
    }, [value, isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      setInternalValue(inputValue);
    };

    const commitValue = () => {
      const numericValue = parseFloat(internalValue);
      const finalValue = isNaN(numericValue) ? 0 : Math.max(min, max ? Math.min(max, numericValue) : numericValue);
      onValueChange(finalValue);
      setInternalValue(finalValue.toString());
    };

    const handleBlur = () => {
      setIsFocused(false);
      commitValue();
    };

    const handleFocus = () => {
      setIsFocused(true);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        commitValue();
        e.currentTarget.blur();
      }
      // Prevent wheel changes
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
      }
    };

    const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
      // Prevent wheel changes
      e.currentTarget.blur();
    };

    return (
      <input
        ref={ref}
        type="number"
        inputMode="decimal"
        value={internalValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        onWheel={handleWheel}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        {...props}
      />
    );
  }
);

NumericInput.displayName = "NumericInput";

export { NumericInput };