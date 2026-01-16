/**
 * Theme composable for managing light/dark mode using Nuxt Color Mode
 */
export const useTheme = () => {
  // Use the built-in Nuxt Color Mode composable
  const colorMode = useColorMode();

  // Create a reactive state that maps to Nuxt Color Mode's value
  const theme = computed<"light" | "dark" | "system">({
    get: () => {
      // Map Nuxt's "system" value (which is actually "auto" in Nuxt Color Mode)
      return colorMode.value === "auto"
        ? "system"
        : (colorMode.value as "light" | "dark");
    },
    set: (newValue) => {
      // Map our "system" value to Nuxt's "auto"
      colorMode.preference = newValue === "system" ? "auto" : newValue;
    },
  });

  // Function to set the theme that matches our existing API
  const setTheme = (newTheme: "light" | "dark" | "system") => {
    theme.value = newTheme;
  };

  return {
    theme,
    setTheme,
  };
};
