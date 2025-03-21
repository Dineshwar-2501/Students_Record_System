
window.addEventListener("load", async () => {
  // Check if the user has a saved session
  const session = await getSessionFromDB(); // Ensure this function returns a Promise

  if (session && session.redirectUrl) {
      console.log("✅ User is already signed in. Redirecting...");
      window.location.href = session.redirectUrl;
  }

  // Register the Service Worker
  if ("serviceWorker" in navigator) {
      navigator.serviceWorker
          .register("./service-worker.js")
          .then((registration) => {
              console.log("Service Worker registered with scope:", registration.scope);
          })
          .catch((error) => {
              console.error("❌ Service Worker registration failed:", error);
          });
  }
});
