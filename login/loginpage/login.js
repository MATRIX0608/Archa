(function(){
  const panels = ['login','forgot','newpass','create'];
  function goto(name){
    panels.forEach(p=>{
      document.getElementById('panel-'+p).classList.toggle('active', p===name);
    });
    if(name==='forgot'){
      document.getElementById('forgot-request-form').style.display = '';
      document.getElementById('forgot-otp-form').style.display = 'none';
      hideToast('forgot-toast');
    }
  }

  document.querySelectorAll('[data-goto]').forEach(el=>{
    el.addEventListener('click', ()=> goto(el.getAttribute('data-goto')));
  });

  document.querySelectorAll('.pw-toggle').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const input = document.getElementById(btn.getAttribute('data-target'));
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.textContent = show ? 'Hide' : 'Show';
    });
  });

  function setError(fieldId, msgId, message){
    document.getElementById(fieldId).classList.add('error');
    document.getElementById(msgId).textContent = message;
  }
  function clearError(fieldId, msgId){
    document.getElementById(fieldId).classList.remove('error');
    document.getElementById(msgId).textContent = '';
  }
  function showToast(id, text){
    const el = document.getElementById(id);
    el.textContent = text;
    el.classList.add('show');
  }
  function hideToast(id){
    document.getElementById(id).classList.remove('show');
  }
  function validEmail(v){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  // ---- LOGIN ----
  document.getElementById('login-form').addEventListener('submit', function(e){
    e.preventDefault();
    let ok = true;
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value;

    clearError('login-email-field','login-email-msg');
    clearError('login-pass-field','login-pass-msg');
    hideToast('login-toast');

    if(!validEmail(email)){ setError('login-email-field','login-email-msg','Enter a valid email address.'); ok=false; }
    if(pass.length < 1){ setError('login-pass-field','login-pass-msg','Enter your password.'); ok=false; }

    if(ok){
      showToast('login-toast', 'Signed in successfully. Redirecting to dashboard\u2026');
    }
  });

  // ---- FORGOT PASSWORD: request code ----
  document.getElementById('forgot-request-form').addEventListener('submit', function(e){
    e.preventDefault();
    const email = document.getElementById('forgot-email').value.trim();
    clearError('forgot-email-field','forgot-email-msg');

    if(!validEmail(email)){
      setError('forgot-email-field','forgot-email-msg','Enter a valid email address.');
      return;
    }
    showToast('forgot-toast', 'Code sent to '+email+'. Check your inbox.');
    document.getElementById('forgot-request-form').style.display = 'none';
    document.getElementById('forgot-otp-form').style.display = '';
  });

  // ---- FORGOT PASSWORD: verify OTP ----
  document.getElementById('forgot-otp-form').addEventListener('submit', function(e){
    e.preventDefault();
    const otp = document.getElementById('otp-code').value.trim();
    clearError('otp-field','otp-msg');

    if(!/^\d{6}$/.test(otp)){
      setError('otp-field','otp-msg','Enter the 6-digit code.');
      return;
    }
    goto('newpass');
  });

  // ---- CREATE ACCOUNT (step 1: name + email) ----
  document.getElementById('create-form').addEventListener('submit', function(e){
    e.preventDefault();
    let ok = true;
    const name = document.getElementById('create-name').value.trim();
    const email = document.getElementById('create-email').value.trim();

    clearError('create-name-field','create-name-msg');
    clearError('create-email-field','create-email-msg');

    if(name.length < 2){ setError('create-name-field','create-name-msg','Enter your full name.'); ok=false; }
    if(!validEmail(email)){ setError('create-email-field','create-email-msg','Enter a valid email address.'); ok=false; }

    if(ok){ goto('newpass'); }
  });

  // ---- CREATE / SET NEW PASSWORD ----
  const p1 = document.getElementById('newpass1');
  const bar = document.getElementById('strength-bar');
  const label = document.getElementById('strength-label');

  p1.addEventListener('input', function(){
    const v = p1.value;
    let score = 0;
    if(v.length >= 8) score++;
    if(/[A-Z]/.test(v)) score++;
    if(/[0-9]/.test(v)) score++;
    if(/[^A-Za-z0-9]/.test(v)) score++;

    const pct = (score/4)*100;
    bar.style.width = pct + '%';
    const colors = ['#c0392b','#c0392b','#e8452c','#f2994a','#27ae60'];
    bar.style.background = colors[score];
    const labels = ['Too weak','Weak','Fair','Good','Strong'];
    label.textContent = v.length ? labels[score] : 'Password strength';
  });

  document.getElementById('newpass-form').addEventListener('submit', function(e){
    e.preventDefault();
    let ok = true;
    const v1 = document.getElementById('newpass1').value;
    const v2 = document.getElementById('newpass2').value;

    clearError('newpass1-field','newpass1-msg');
    clearError('newpass2-field','newpass2-msg');
    hideToast('newpass-toast');

    if(v1.length < 8){ setError('newpass1-field','newpass1-msg','Use at least 8 characters.'); ok=false; }
    if(v2 !== v1 || v2.length===0){ setError('newpass2-field','newpass2-msg','Passwords do not match.'); ok=false; }

    if(ok){
      showToast('newpass-toast', 'Password saved. You can now sign in.');
      setTimeout(()=> goto('login'), 1200);
    }
  });

})();
