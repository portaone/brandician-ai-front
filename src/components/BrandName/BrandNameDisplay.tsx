import { Brand } from "../../types";

const BrandNameDisplay: React.FC<{ brand: Brand }> = ({ brand }) => {
  return (
    <div className="text-xl font-display">
      Brand:{" "}
      <span className="text-primary-700 font-bold text-xl">
        {brand?.brand_name || brand?.name || "Default"}
      </span>
    </div>
  );
};

export default BrandNameDisplay;
