import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App"
import { authGateway } from "auth-gateway"
import { experienceGateway } from "experience-gateway"
import { decisionRecordRepo } from "decision-record-repo"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App auth={authGateway} experience={experienceGateway} repo={decisionRecordRepo} />
  </StrictMode>,
)
