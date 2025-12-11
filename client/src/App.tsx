import { QueryClientProvider, QueryClient } from "react-query";
import { useEffect, useState } from "react";
import { BurnerManager } from "@dojoengine/create-burner";
import VRFTest from './components/VRFTest'
import './App.css'
import { setupBurner } from './setup'

const queryClient = new QueryClient();

function App() {
  const [burnerManager, setBurnerManager] = useState<BurnerManager | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initBurner = async () => {
      try {
        setIsLoading(true);
        const manager = await setupBurner();
        setBurnerManager(manager);
      } catch (err: any) {
        console.error("Failed to setup burner:", err);
        setError(err?.message || "Failed to initialize burner account");
      } finally {
        setIsLoading(false);
      }
    };

    initBurner();
  }, []);

  if (isLoading) {
    return (
      <div className="app">
        <div style={{ textAlign: "center", color: "white", padding: "20px" }}>
          <p>Initializing burner account...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div style={{ textAlign: "center", color: "red", padding: "20px" }}>
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!burnerManager) {
    return (
      <div className="app">
        <div style={{ textAlign: "center", color: "white", padding: "20px" }}>
          <p>No burner account available</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="app">
        <VRFTest burnerManager={burnerManager} />
      </div>
    </QueryClientProvider>
  )
}

export default App
