import { Brand } from "../../types";
import { useBrandStore } from "../../store/brand";
import { useParams } from "react-router-dom";
import { useEffect } from "react";

const BrandNameDisplay: React.FC<{ brand: Brand }> = ({ brand }) => {
  const { brandId } = useParams<{ brandId: string }>();
  const { selectBrand, currentBrand } = useBrandStore();
  let selectedBrand: Brand | null = brand;

  useEffect(() => {
    if (brandId && !selectedBrand) {
      selectBrand(brandId);
      selectedBrand = currentBrand;
    }
  }, []);

  return (
    <div className="text-xl font-display">
      Brand:{" "}
      <span className="text-primary-700 font-bold text-xl">
        {selectedBrand?.brand_name ||
          selectedBrand?.name ||
          "Unknown (error loading brand)"}
      </span>
    </div>
  );
};

export default BrandNameDisplay;
