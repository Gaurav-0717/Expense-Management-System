// quick test script to POST to signup and then login
(async function(){
  try{
    const signupRes = await fetch('http://127.0.0.1:5000/api/signup', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ name: 'ScriptUser', email: 'scriptuser@example.com', password: 'ScriptPass123' })
    });
    const signupJson = await signupRes.json().catch(()=>null);
    console.log('signup', signupRes.status, signupJson);

    const loginRes = await fetch('http://127.0.0.1:5000/api/login', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ email: 'scriptuser@example.com', password: 'ScriptPass123' })
    });
    const loginJson = await loginRes.json().catch(()=>null);
    console.log('login', loginRes.status, loginJson);
  }catch(err){
    console.error('error', err);
  }
})();
