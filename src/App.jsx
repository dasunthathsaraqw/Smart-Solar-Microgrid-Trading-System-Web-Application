// App.jsx — top-level route definitions for the web application.
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import CreateAccount from "./pages/CreateAccount";
import DashboardBackoffice from "./pages/DashboardBackoffice";
import DashboardOperator from "./pages/DashboardOperator";
import RequireAuth from "./components/RequireAuth";
import { ConfirmProvider } from "./components/ConfirmProvider";

function App() {
  return (
    <ConfirmProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/create-account"
            element={
              <RequireAuth allowedRoles={["Backoffice"]}>
                <CreateAccount />
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard/backoffice"
            element={
              <RequireAuth allowedRoles={["Backoffice"]}>
                <DashboardBackoffice />
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard/operator"
            element={
              <RequireAuth allowedRoles={["GridOperator"]}>
                <DashboardOperator />
              </RequireAuth>
            }
          />
        </Routes>
      </BrowserRouter>
    </ConfirmProvider>
  );
}

export default App;
