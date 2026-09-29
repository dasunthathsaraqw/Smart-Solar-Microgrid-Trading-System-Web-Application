// MapErrorBoundary.jsx — Error boundary to catch Leaflet map initialization errors gracefully.
import { Component } from "react";

export class MapErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Map rendering error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-64 w-full flex-col items-center justify-center rounded-lg border border-brand-border bg-brand-white-soft p-6 text-center shadow-sm">
          <p className="text-sm font-semibold text-brand-black">Interactive Map Unavailable</p>
          <p className="mt-1 text-xs text-brand-muted">
            {this.state.error?.message || "An error occurred while initializing the map view."}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 rounded-md border border-brand-green px-3 py-1.5 text-xs font-medium text-brand-green hover:bg-brand-green-soft"
          >
            Retry Loading Map
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MapErrorBoundary;
