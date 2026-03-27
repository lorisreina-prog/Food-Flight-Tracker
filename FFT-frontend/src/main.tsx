import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// StrictMode removed: html5-qrcode is not compatible with double-effect invocation
ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
