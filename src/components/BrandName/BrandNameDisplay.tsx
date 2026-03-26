import { Brand } from "../../types";

const BrandNameDisplay: React.FC<{ brand: Brand }> = ({ brand }) => {
  return (
    <p className="brand-label">
      Brand:{" "}
      <span className="brand-name">
        {brand?.brand_name || brand?.name || "Unknown (error loading brand)"}
      </span>
    </p>
  );
};

export default BrandNameDisplay;
