async function testAuth() {
  console.log('Testing WCAGuard Auth Middleware on port 4000...\n');

  // 1. Health check (public)
  const health = await fetch('http://localhost:4000/health');
  console.log('1. Health check status:', health.status);

  // 2. Unauthenticated request to /api/scan (should reject with 401)
  const unauth = await fetch('http://localhost:4000/api/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'https://example.com' })
  });
  console.log('2. Unauthenticated /api/scan status:', unauth.status);
  const unauthBody = await unauth.json();
  console.log('   Response error message:', unauthBody.error);

  // 3. Authenticated request with Bearer token
  const authRes = await fetch('http://localhost:4000/api/analyze-code', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer mock-jwt-token-testuser'
    },
    body: JSON.stringify({ code: '<img src="test.jpg" />' })
  });
  console.log('3. Authenticated /api/analyze-code status:', authRes.status);
  const authData = await authRes.json();
  console.log('   Violations detected:', authData.violations?.length);
  console.log('   Certificates generated:', authData.certificates?.length);
  console.log('   Remediated code:', authData.remediatedCode);

  if (unauth.status === 401 && authRes.status === 200) {
    console.log('\n✅ All Stage 2 Express Auth Middleware tests PASSED!');
  } else {
    console.error('\n❌ Tests FAILED!');
    process.exit(1);
  }
}

testAuth().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
