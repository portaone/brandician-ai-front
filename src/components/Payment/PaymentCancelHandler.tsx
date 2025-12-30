import { Loader } from "lucide-react";
import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const PaymentCancelHandler: React.FC = () => {
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
      // Navigate back to payment page with error message
      const targetUrl = `/brands/${brandId}/payment?error=payment_cancelled`;
      navigate(targetUrl);
    } else {
      // If no brandId found, redirect to brands list
      console.error("No brandId found in payment cancel callback");
      navigate("/brands");
    }
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center">
        <Loader className="animate-spin h-6 w-6 text-primary-600 mr-2" />
        <span>Processing payment cancellation...</span>
      </div>
    </div>
  );
};

export default PaymentCancelHandler;
