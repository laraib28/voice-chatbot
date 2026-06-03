"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  override render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div
            role="alert"
            className="flex flex-col items-center justify-center gap-2 p-8 text-center text-sm text-muted-foreground"
          >
            <p className="font-medium text-foreground">Something went wrong.</p>
            {this.state.message && (
              <p className="text-xs opacity-70">{this.state.message}</p>
            )}
            <button
              className="mt-2 text-xs underline hover:no-underline"
              onClick={() => this.setState({ hasError: false, message: "" })}
            >
              Try again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
