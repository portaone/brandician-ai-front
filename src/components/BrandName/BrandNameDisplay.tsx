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
    <p className="brand-label">
      Brand:{" "}
      <span className="brand-name">
        {selectedBrand?.brand_name ||
          selectedBrand?.name ||
          "Unknown (error loading brand)"}
      </span>
    </p>
  );
};

export default BrandNameDisplay;
