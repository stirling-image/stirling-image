import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/home-page";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}
