import { useState, useRef, useEffect, KeyboardEvent, FocusEvent } from "react";
import { Input } from "@/components/ui/input";

interface AutocompleteInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onFocus?: (e: FocusEvent<HTMLInputElement>) => void;
  suggestions: string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const AutocompleteInput = ({
  id,
  value,
  onChange,
  onFocus,
  suggestions,
  placeholder,
  disabled,
  className,
}: AutocompleteInputProps) => {
  const [suggestion, setSuggestion] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [textWidth, setTextWidth] = useState(0);

  // Find matching suggestion
  useEffect(() => {
    if (value && suggestions.length > 0) {
      const match = suggestions.find(
        (s) => s.toLowerCase().startsWith(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase()
      );
      setSuggestion(match || "");
    } else {
      setSuggestion("");
    }
  }, [value, suggestions]);

  // Measure text width
  useEffect(() => {
    if (measureRef.current && value) {
      setTextWidth(measureRef.current.offsetWidth);
    } else {
      setTextWidth(0);
    }
  }, [value]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Accept suggestion on Tab or ArrowRight
    if ((e.key === "Tab" || e.key === "ArrowRight") && suggestion) {
      e.preventDefault();
      onChange(suggestion);
      setSuggestion("");
    }
  };

  return (
    <div className="relative">
      {/* Hidden span to measure text width */}
      <span
        ref={measureRef}
        className="absolute invisible whitespace-pre text-sm px-3"
        style={{ font: "inherit" }}
      >
        {value}
      </span>

      {/* Suggestion overlay */}
      {suggestion && value && (
        <div className="absolute inset-0 pointer-events-none flex items-center">
          <div className="px-3 text-sm" style={{ paddingLeft: `calc(0.75rem + ${textWidth}px)` }}>
            <span className="text-muted-foreground/50">
              {suggestion.slice(value.length)}
            </span>
          </div>
        </div>
      )}

      {/* Actual input */}
      <Input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        autoComplete="off"
      />
    </div>
  );
};
