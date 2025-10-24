import { useEffect, useRef, useState } from "react";
import {BrowserRouter, Routes, Route} from "react-router-dom";
import Test from "./pages/Test";
import Demo from "./pages/Demo";
import { DotPadSDK } from "./DotPadSDK-1.0.0";
import { Device } from "./device";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
    <Routes>
      <Route path="/test" element={<Test />} />
      <Route path="/demo" element={<Demo />} />
    </Routes>
  </BrowserRouter>
  )
}
