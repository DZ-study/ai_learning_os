import { Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/toast";

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
      <Toaster />
    </div>
  );
}

export default App;
