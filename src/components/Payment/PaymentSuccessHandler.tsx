import BrandicianLoader from "../common/BrandicianLoader";
import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const PaymentSuccessHandler: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Extract brandId from URL parameters
    // PayPal includes custom parameters in the return URL
    const brandId =
      searchParams.get("brand_id") ||
      searchParams.get("custom") ||
      searchParams.get("item_number");

    if (brandId) {
      // Navigate to payment success verification page (not directly to completed)
      // This page will verify payment status and progress the brand status
      const targetUrl = `/brands/${brandId}/payment/success`;
      navigate(targetUrl);
    } else {
      // If no brandId found, redirect to brands list
      console.error("No brandId found in payment success callback");
      navigate("/brands");
    }
  }, [navigate, searchParams]);

  return (
    <div className="loader-container">
      <div className="flex items-center">
        <BrandicianLoader />
        <span>Processing payment confirmation...</span>
      </div>
    </div>
  );
};

export default PaymentSuccessHandler;
