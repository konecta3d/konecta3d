"use client";

export default function TestPage() {
  const testReset = async () => {
    const result = document.getElementById('result');
    if (!result) return;
    result.textContent = 'Testing...';
    
    try {
      const res = await fetch('/api/test-password?email=udarafisioterapia@gmail.com&password=Udar2024!');
      const data = await res.json();
      result.textContent = JSON.stringify(data, null, 2);
    } catch (err: any) {
      result.textContent = 'Error: ' + err.message;
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>Reset Password Test</h1>
      <button onClick={testReset} style={{ padding: '10px 20px', fontSize: 16 }}>
        Reset Password for udarafisioterapia@gmail.com
      </button>
      <pre id="result" style={{ background: '#f0f0f0', padding: 10, marginTop: 20, whiteSpace: 'pre-wrap' }}></pre>
    </div>
  );
}
