import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { createContext } from "react";
import Test from "./pages/Test";
import Navigation from "./pages/Navigation";
import Dictionary from "./pages/Dictionary";
import Navbar from "./components/Navbar";
import Quiz  from "./pages/Quiz";
import "./App.css";

import { DotPadSDK } from "./DotPadSDK-1.0.0";

const dotPadSdk = new DotPadSDK();
export const DotPadContext = createContext(dotPadSdk);

export default function App() {
  return (
    <DotPadContext.Provider value={dotPadSdk}>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Navigate to="/dictionary" replace />} />
          <Route path="/dictionary" element={<Dictionary />} />
          <Route path="/test" element={<Test />} />
          <Route path="/quiz" element={<Quiz />} />
        </Routes>
      </BrowserRouter>
    </DotPadContext.Provider>
  );
}
