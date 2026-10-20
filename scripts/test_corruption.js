async function test() {
  const loginRes = await fetch('http://localhost:8000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailOrUsername: 'student@dut.udn.vn', password: 'student123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;

  const query = `Tham nhũng gây ra rất nhiều hậu quả nghiêm trọng trên tất cả các lĩnh vực của đời sống xã hội. Bằng kiến thức đã học anh (chị) hãy phân tích tác hại của tham nhũng?`;

  const res = await fetch('http://localhost:8000/api/v1/query/solve', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ query })
  });
  const d = await res.json();
  console.log('Intent:', d.intentCode);
  console.log('Latency:', d.latencyMs);
  console.log('Answer:\n', d.response);
}
test();
