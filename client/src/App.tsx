/* Paper Lantern direction: route the experience into calm, purposeful rooms instead of one crowded scroll. */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import SiteLayout from "./components/SiteLayout";
import Home from "./pages/Home";
import Manage from "./pages/Manage";
import Write from "./pages/Write";
import Rituals from "./pages/Rituals";
import About from "./pages/About";
import Creators from "./pages/Creators";
import Customize from "./pages/Customize";
import NotFound from "./pages/NotFound";

function Router() { return <SiteLayout><Switch><Route path="/" component={Home} /><Route path="/write" component={Write} /><Route path="/rituals" component={Rituals} /><Route path="/about" component={About} /><Route path="/creators" component={Creators} /><Route path="/customize" component={Customize} />
      <Route path="/manage/:token" component={Manage} /><Route component={NotFound} /></Switch></SiteLayout>; }
export default function App() { return <ErrorBoundary><ThemeProvider defaultTheme="light"><LanguageProvider><TooltipProvider><Toaster /><Router /></TooltipProvider></LanguageProvider></ThemeProvider></ErrorBoundary>; }
