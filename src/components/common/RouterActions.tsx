import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { scrollToTop } from "../../lib/utils";

// This component listens to route changes and performs actions on route change
export function RouterActions() {
  const location = useLocation();

  useEffect(() => {
    scrollToTop();
  }, [location]);

  return null;
}
