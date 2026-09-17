import "@/i18n"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "react-router-dom"
import "./index.css"
import { router } from "./router"
// import ZustandDemo from './study_demo/zustand_demo'

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* <ZustandDemo /> */}
    <RouterProvider router={router} />
  </StrictMode>,
)
