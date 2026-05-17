async function login() {
  const csrfRes = await fetch("http://localhost:3000/api/auth/csrf");
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;
  const cookiesArr = csrfRes.headers.get('set-cookie');
  let cookies = cookiesArr ? cookiesArr.split(', ').map(c => c.split(';')[0]).join('; ') : '';

  const res = await fetch("http://localhost:3000/api/auth/callback/credentials", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": cookies
    },
    body: `email=admin%40demo.com&password=password123&csrfToken=${csrfToken}&json=true`
  });
  
  const authCookiesArr = res.headers.get('set-cookie');
  let authCookies = authCookiesArr ? authCookiesArr.split(', ').map(c => c.split(';')[0]).join('; ') : '';

  console.log("Calling session...");
  const sessionRes = await fetch("http://localhost:3000/api/auth/session", {
    headers: {
      "Cookie": authCookies || cookies
    }
  });
  console.log("Session status:", sessionRes.status);
  const text = await sessionRes.text();
  console.log("Session body:", text);
}

login().catch(console.error);
