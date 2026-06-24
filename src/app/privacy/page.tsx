import React from 'react';

export default function PrivacyPolicyPage() {
  return (
    <div style={{ maxWidth: 896, margin: '0 auto', padding: '1.5rem', paddingTop: '2rem', paddingBottom: '6rem' }}>
      <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--color-text-primary)' }}>Privacy Policy</h1>
      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>Last Updated: {new Date().toLocaleDateString()}</p>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-primary)' }}>1. Introduction</h2>
        <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          Welcome to Ledger360. We are committed to protecting your personal data and your right to privacy. 
          This Privacy Policy explains how we collect, use, and share your personal information in compliance 
          with the Kenya Data Protection Act (DPA), 2019. We process your data in accordance with the regulations of the Office of the Data Protection Commissioner (ODPC).
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-primary)' }}>2. Lawful Basis for Processing</h2>
        <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>We process your personal data under the following lawful bases:</p>
        <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '1rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li><strong>Consent:</strong> When you upload M-Pesa SMS or statements, we rely on your explicit consent to process the data, extract financial insights, and use our AI features.</li>
          <li><strong>Contract:</strong> We process your account and usage information to provide the core services of Ledger360, including budgeting, net-worth tracking, and synchronization.</li>
          <li><strong>Legal Obligation:</strong> To comply with applicable laws, including data retention and ODPC reporting requirements.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-primary)' }}>3. AI Processing & Cross-Border Transfers</h2>
        <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          To provide intelligent financial insights from your uploaded documents and SMS, we utilize AI models provided by Google Gemini. 
          By uploading these documents, you explicitly consent to this processing.
        </p>
        <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          <strong>Important Safeguards:</strong> 
        </p>
        <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '1rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li>We redact sensitive PII (like phone numbers and full names) from SMS before processing.</li>
          <li>We use a data-governed tier of Google Gemini, meaning your data is <strong>never used to train their models</strong>.</li>
          <li>Because these servers may reside outside Kenya, your use of the AI features constitutes consent to the cross-border transfer of data under appropriate security safeguards.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-primary)' }}>4. Data Retention</h2>
        <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          We retain your financial data only as long as your account is active, to provide you with historical budgeting and net worth insights. 
          If you delete your account, all associated personal data, including transactions and AI processing logs, will be irreversibly deleted or anonymized within 30 days.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-primary)' }}>5. Your Data Subject Rights</h2>
        <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>Under the Kenya DPA, you have the right to:</p>
        <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '1rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li><strong>Access:</strong> Request a copy of your data in a machine-readable format.</li>
          <li><strong>Erasure:</strong> Request the deletion of your account and associated personal data.</li>
          <li><strong>Withdraw Consent:</strong> You may withdraw consent for AI processing at any time, though this will limit the functionality of the statement upload features.</li>
          <li><strong>Rectification:</strong> Correct any inaccurate data we hold about you.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-primary)' }}>6. Contact Us</h2>
        <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          For any questions about this Privacy Policy or to exercise your rights, please contact our Data Protection Officer at privacy@ledger360.com.
        </p>
      </section>
    </div>
  );
}
