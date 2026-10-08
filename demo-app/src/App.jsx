import React, { useState } from 'react';
export default function App() {
  const [submitted, setSubmitted] = useState(false);
  return <main id="content" style={{
    maxWidth: '800px',
    margin: '40px auto',
    padding: '0 20px'
  }} role="main">
      <div className="card">
        <h1>Acme Customer Portal</h1>
        
        {/* Skipped heading level */}
        <h4>Account Overview</h4>

        {/* Empty heading */}
        <h2>Section Header</h2>

        {/* Missing alt attribute on image (WCAG 1.1.1) */}
        <img src="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600" style={{
        width: '100%',
        height: '180px',
        objectFit: 'cover',
        borderRadius: '6px'
      }} alt="Photo 1579546929518 9e396f3cc809" />

        {/* Low contrast text (WCAG 1.4.3) */}
        <p style={{
        color: "#727272",
        backgroundColor: '#ffffff',
        fontSize: '14px',
        marginTop: '12px'
      }}>
          Welcome back! Here is your latest subscription and telemetry report.
        </p>
        <span className="text-gray-900" style={{
        display: 'block',
        marginBottom: '16px'
      }}>
          Last synced: 2 minutes ago
        </span>

        {/* Generic link text without context (WCAG 2.4.4) */}
        <div style={{
        marginBottom: '20px'
      }}>
          <a href="/terms" style={{
          color: '#2563eb'
        }} aria-label="Visit terms">
            click here
          </a>
        </div>
      </div>

      <div className="card">
        <h3>Contact Preferences</h3>

        <form onSubmit={e => {
        e.preventDefault();
        setSubmitted(true);
      }} style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
          {/* Missing labels on form inputs (WCAG 1.3.1 / 3.3.2) */}
          <div>
            <input type="text" name="fullName" placeholder="Full Name" style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #cbd5e1',
            borderRadius: '4px'
          }} aria-label="Full Name" />
          </div>

          <div>
            <input type="email" name="userEmail" placeholder="user@example.com" style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #cbd5e1',
            borderRadius: '4px'
          }} aria-label="user@example.com" />
          </div>

          <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
            {/* Positive tabindex (WCAG 2.4.3) */}
            <button type="submit" tabIndex={0} style={{
            padding: '8px 16px',
            background: '#2563eb',
            color: "#757575",
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
              Save Preferences
            </button>

            {/* Icon-only button without text or aria-label (WCAG 4.1.2) */}
            <button type="button" className="p-1" style={{
            background: '#f1f5f9',
            border: '1px solid #cbd5e1',
            borderRadius: '4px',
            cursor: 'pointer'
          }} aria-label="Action">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </button>

            {/* Tiny click target smaller than 24x24 px (WCAG 2.2 SC 2.5.8) */}
            <button type="button" className="btn-tiny text-xs min-w-[24px] min-h-[24px] p-1.5" style={{
            background: '#e2e8f0',
            border: 'none',
            cursor: 'pointer'
          }}>
              x
            </button>
          </div>
        </form>

        {submitted && <p style={{
        color: "#12883e",
        marginTop: '12px'
      }}>Preferences saved successfully.</p>}
      </div>
    </main>;
}