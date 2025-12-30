import { History } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "./Button";

interface HistoryButtonProps {
  brandId: string;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg" | "xl";
}

const HistoryButton: React.FC<HistoryButtonProps> = ({
  brandId,
  variant = "outline",
  size = "md",
}) => {
  const navigate = useNavigate();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => navigate(`/brands/${brandId}/history`)}
    >
      <History className="h-4 w-4 mr-2 inline" />
      History
    </Button>
  );
};

export default HistoryButton;
