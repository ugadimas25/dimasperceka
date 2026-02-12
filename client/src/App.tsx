import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import ProjectFloodAnalysis from "@/pages/ProjectFloodAnalysis";
import ProjectGeoGPT from "@/pages/ProjectGeoGPT";
import ProjectSupplychainEmission from "@/pages/ProjectSupplychainEmission";
import ProjectDigitalTwinClimate from "@/pages/ProjectDigitalTwinClimate";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/project/flood-analysis" component={ProjectFloodAnalysis} />
      <Route path="/project/geogpt" component={ProjectGeoGPT} />
      <Route path="/project/supplychain-emission" component={ProjectSupplychainEmission} />
      <Route path="/project/digital-twin-climate" component={ProjectDigitalTwinClimate} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
