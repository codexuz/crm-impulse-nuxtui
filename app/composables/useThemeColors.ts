export const useThemeColors = () => {
  const appConfig = useAppConfig();

  const loadColors = () => {
    if (import.meta.client) {
      const savedPrimary = localStorage.getItem("theme-color-primary");
      const savedNeutral = localStorage.getItem("theme-color-neutral");

      if (savedPrimary) {
        appConfig.ui.colors.primary = savedPrimary;
      }
      if (savedNeutral) {
        appConfig.ui.colors.neutral = savedNeutral;
      }
    }
  };

  const setPrimaryColor = (color: string) => {
    appConfig.ui.colors.primary = color;
    if (import.meta.client) {
      localStorage.setItem("theme-color-primary", color);
    }
  };

  const setNeutralColor = (color: string) => {
    appConfig.ui.colors.neutral = color;
    if (import.meta.client) {
      localStorage.setItem("theme-color-neutral", color);
    }
  };

  return {
    loadColors,
    setPrimaryColor,
    setNeutralColor,
  };
};
