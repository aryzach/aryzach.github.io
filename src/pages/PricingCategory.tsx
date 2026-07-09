import { Navigate } from "react-router-dom";

// Intermediate /pricing/:category pages were removed. All traffic goes back
// to /pricing where each category has its Indoor/Outdoor cards inline.
const PricingCategory = () => <Navigate to="/pricing" replace />;

export default PricingCategory;
