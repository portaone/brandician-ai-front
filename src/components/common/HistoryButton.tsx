import { History } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "./Button";

interface HistoryButtonProps {
  brandId: string;
  variant?: "primary" | "secondary" | "tertiary";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const HistoryButton: React.FC<HistoryButtonProps> = ({
  brandId,
  variant = "secondary",
  size = "md",
  className,
}) => {
  const navigate = useNavigate();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => navigate(`/brands/${brandId}/history`)}
      className={className}
    >
      <History className="h-4 w-4 mr-2 inline" />
      History
    </Button>
  );
};

export default HistoryButton;
