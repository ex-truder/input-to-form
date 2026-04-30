import { useLocation, useParams } from "react-router-dom";
import { DEFAULT_LOCALE, getLocaleFromPathname, isValidLocale } from "./config";

export function useLocale() {
  const params = useParams();
  const location = useLocation();

  if (params.locale && isValidLocale(params.locale)) {
    return params.locale;
  }

  return getLocaleFromPathname(location.pathname) || DEFAULT_LOCALE;
}