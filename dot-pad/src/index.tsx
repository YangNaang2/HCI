import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

// React 에러 오버레이 숨기기 (개발 모드에서도)
if (process.env.NODE_ENV === 'development') {
  const showErrorOverlay = (err: any) => {
    // 에러는 콘솔에만 로깅하고 오버레이는 표시하지 않음
    console.error('Runtime error:', err);
  };
  
  window.addEventListener('error', showErrorOverlay);
  window.addEventListener('unhandledrejection', showErrorOverlay);
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
