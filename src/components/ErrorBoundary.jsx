import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'monospace', background: '#0D0D0F', color: '#F2F2F3', minHeight: '100vh' }}>
          <h2 style={{ color: '#EF4444', marginBottom: '0.5rem' }}>Something went wrong</h2>
          <pre style={{ color: '#8A8A8F', fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>{this.state.error.message}</pre>
          <p style={{ marginTop: '1rem', color: '#8A8A8F' }}>
            Check that your <code style={{ color: '#F2F2F3' }}>.env.local</code> file exists with valid Supabase credentials.
          </p>
        </div>
      )
    }
    return this.props.children
  }
}
