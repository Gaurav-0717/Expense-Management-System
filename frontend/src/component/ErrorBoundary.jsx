import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught an error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, color: '#b91c1c' }}>
          <h2>Something went wrong.</h2>
          <p>The page could not be rendered. Please refresh the app.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
