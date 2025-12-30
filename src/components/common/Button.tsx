import React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  children,
  loading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}) => {
  const baseClasses = "btn";
  const variantClasses = `btn-${variant}`;
  const sizeClasses = `btn-${size}`;

  // Font size and padding mapping
  const fontSizeMap = {
    sm: "12px",
    md: "15px",
    lg: "18px",
    xl: "15px",
  };

  const paddingMap = {
    sm: "8px 12px",
    md: "9px 20px",
    lg: "10px 14px",
    xl: "9px 17px 9px 27px",
  };

  const letterSpacingMap = {
    sm: "2px",
    md: "2px",
    lg: "2px",
    xl: "2px",
  };

  const buttonClasses = cn(baseClasses, variantClasses, sizeClasses, className);

  return (
    <button
      className={buttonClasses}
      style={{
        fontSize: fontSizeMap[size],
        padding: paddingMap[size],
        letterSpacing: letterSpacingMap[size],
        textTransform: "uppercase",
      }}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!loading && rightIcon && <span className="ml-[10px]">{rightIcon}</span>}
    </button>
  );
};

export default Button;
