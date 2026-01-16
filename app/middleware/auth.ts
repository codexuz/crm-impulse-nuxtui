export default defineNuxtRouteMiddleware((to, from) => {
  const { auth } = useAuth();

  // If user is not authenticated and trying to access a protected route
  if (!auth.value.isAuthenticated && to.path !== "/login") {
    return navigateTo("/login");
  }

  // If user is authenticated and trying to access login page
  if (auth.value.isAuthenticated && to.path === "/login") {
    return navigateTo("/");
  }

  return;
});
