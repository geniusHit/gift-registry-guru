import { Buffer } from "buffer";
window.global = window;
window.Buffer = Buffer;

import { BrowserRouter } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Routes from "./Routes";
import MyRoutes from "./pages/MyRoutes";

import "./pages/MyStyle.css";
import "./pages/custom-Style.css";

import { QueryProvider, PolarisProvider } from "./components";

export default function App() {
  const pages = import.meta.glob(
    "./pages/**/!(*.test.[jt]sx)*.([jt]sx)",
    { eager: true }
  );

  console.log("pages = ", pages)

  const { t } = useTranslation();

  return (
    <PolarisProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <QueryProvider>
          {/* ✅ Your custom routing layer */}
          <MyRoutes />

          {/* ✅ Shopify template auto-routes (optional) */}
          <Routes pages={pages} />
        </QueryProvider>
      </BrowserRouter>
    </PolarisProvider>
  );
}
