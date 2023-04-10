import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";

const container = document.getElementById("root") as HTMLElement;
const root = createRoot(container);

root.render(
	<BrowserRouter basename={import.meta.env.VITE_SUBFOLDER ?? '/'}>
		<App />
	</BrowserRouter>,
);
