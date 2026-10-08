/**
 * Verification script for Stage 3: Fix System Only for Pasted Code
 */

async function testStage3() {
  console.log('Testing WCAGuard Stage 3 Pipeline on port 4000...\n');

  // Test 1: Server enforcement: POST /api/fix with input_type = "url" MUST return 400
  console.log('1. Testing POST /api/fix with input_type="url" (should return 400)...');
  const rejectRes = await fetch('http://localhost:4000/api/fix', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer mock-jwt-token-tester'
    },
    body: JSON.stringify({
      inputType: 'url',
      targetUrl: 'https://example.com'
    })
  });
  console.log(`   Response status: ${rejectRes.status} (Expected 400)`);
  const rejectBody = await rejectRes.json();
  console.log(`   Rejection message: "${rejectBody.error}"`);
  if (rejectRes.status !== 400) {
    throw new Error('FAIL: Server did not return 400 for input_type="url"');
  }

  // Test 2: Code AST Scan, Repair, Recheck, SHA-256 and Certification
  console.log('\n2. Testing Code Pipeline (Babel AST, Deterministic Fix, Recheck, SHA-256)...');
  const brokenCode = `import React from 'react';
export default function Card() {
  return (
    <div>
      <img src="avatar.jpg" />
      <button><span className="icon">✓</span></button>
    </div>
  );
}`;

  const codeRes = await fetch('http://localhost:4000/api/analyze-code', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer mock-jwt-token-tester'
    },
    body: JSON.stringify({ code: brokenCode })
  });
  console.log(`   Analyze response status: ${codeRes.status} (Expected 200)`);
  const codeData = await codeRes.json();

  console.log(`   SHA-256 Hash: ${codeData.sha256}`);
  console.log(`   Violations detected: ${codeData.violations.length}`);
  console.log(`   Certificates generated: ${codeData.certificates.length}`);
  console.log(`   Remediated code preview:\n   ${codeData.remediatedCode.replace(/\n/g, '\n   ')}`);

  // Validate exact status labels
  const validLabels = new Set(['Certified', 'Needs review', 'Unfixable', 'CERTIFIED', 'NEEDS_REVIEW', 'UNFIXABLE']);
  codeData.certificates.forEach((cert) => {
    console.log(`   Cert: ${cert.ruleId} -> Status: [${cert.status}]`);
    if (!validLabels.has(cert.status)) {
      throw new Error(`FAIL: Unexpected status label "${cert.status}"`);
    }
  });

  if (!codeData.sha256 || codeData.sha256.length !== 64) {
    throw new Error('FAIL: Invalid SHA-256 hash');
  }

  // Test 3: PDF Report / Certificate Generation (PDFKit)
  console.log('\n3. Testing PDF Report Generation via /api/report/:id/pdf...');
  const pdfRes = await fetch(`http://localhost:4000/api/report/${codeData.scanId}/pdf`, {
    headers: {
      'Authorization': 'Bearer mock-jwt-token-tester'
    }
  });
  console.log(`   PDF stream status: ${pdfRes.status} (Expected 200)`);
  console.log(`   Content-Type: ${pdfRes.headers.get('content-type')}`);
  if (pdfRes.status !== 200 || !pdfRes.headers.get('content-type')?.includes('application/pdf')) {
    throw new Error('FAIL: PDF generation failed');
  }

  console.log('\n✅ All Stage 3 Server Pipeline tests PASSED successfully!');
}

testStage3().catch((err) => {
  console.error('\n❌ Stage 3 Test FAILED:', err);
  process.exit(1);
});
