import { BrowserRouter, Routes, Route } from "react-router-dom";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div className="p-8 text-2xl font-bold text-primary">Stirling Image</div>} />
      </Routes>
    </BrowserRouter>
  );
}
