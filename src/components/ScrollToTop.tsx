import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Force le scroll tout en haut à chaque changement de page/menu
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}
