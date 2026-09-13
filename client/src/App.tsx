import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { Footer } from "./components/Footer.js";
import { NavBar } from "./components/NavBar.js";
import { AlgorithmDetailPage } from "./pages/AlgorithmDetailPage.js";
import { AlgorithmsPage } from "./pages/AlgorithmsPage.js";
import { HomePage } from "./pages/HomePage.js";
import { LoginPage } from "./pages/LoginPage.js";
import { ProfilePage } from "./pages/ProfilePage.js";
import { RegisterPage } from "./pages/RegisterPage.js";
import { SolvePage } from "./pages/SolvePage.js";
import { TimerPage } from "./pages/TimerPage.js";
import { TrainerPage } from "./pages/TrainerPage.js";
import { useAuthStore } from "./store/authStore.js";

export function App() {
  const restoreSession = useAuthStore((s) => s.restoreSession);

  useEffect(() => {
    restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <NavBar />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/solve" element={<SolvePage />} />
          <Route path="/algorithms" element={<AlgorithmsPage />} />
          <Route path="/algorithms/:id" element={<AlgorithmDetailPage />} />
          <Route path="/trainer" element={<TrainerPage />} />
          <Route path="/timer" element={<TimerPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </div>
      <Footer />
    </>
  );
}
