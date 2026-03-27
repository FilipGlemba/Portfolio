// ===== 1. LOADING SCREEN =====
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('loader').classList.add('hidden');
  }, 2000);
});


// ===== 2. CUSTOM CURSOR =====
const cursor    = document.getElementById('cursor');
const cursorDot = document.getElementById('cursorDot');

document.addEventListener('mousemove', (e) => {
  cursor.style.left    = e.clientX + 'px';
  cursor.style.top     = e.clientY + 'px';
  cursorDot.style.left = e.clientX + 'px';
  cursorDot.style.top  = e.clientY + 'px';
});

// Zväčší cursor keď ho dáš na klikateľný prvok
document.querySelectorAll('a, button, .skill-card, .project-card, .stat-box').forEach(el => {
  el.addEventListener('mouseenter', () => cursor.classList.add('expand'));
  el.addEventListener('mouseleave', () => cursor.classList.remove('expand'));
});


// ===== 3. PARTICLES =====
const canvas = document.getElementById('particles');
const ctx    = canvas.getContext('2d');

canvas.width  = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
});

const particleCount = 70;
const particles = [];

for (let i = 0; i < particleCount; i++) {
  particles.push({
    x:       Math.random() * canvas.width,
    y:       Math.random() * canvas.height,
    vx:      (Math.random() - 0.5) * 0.4,
    vy:      (Math.random() - 0.5) * 0.4,
    radius:  Math.random() * 1.5 + 0.5,
    opacity: Math.random() * 0.5 + 0.1,
  });
}

function drawParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach(p => {
    // Pohyb
    p.x += p.vx;
    p.y += p.vy;

    // Odraz od okrajov
    if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

    // Kreslenie
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(124, 109, 250, ${p.opacity})`;
    ctx.fill();
  });

  // Čiary medzi blízkymi particles
  particles.forEach((a, i) => {
    particles.slice(i + 1).forEach(b => {
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (dist < 100) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(124, 109, 250, ${0.15 * (1 - dist / 100)})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    });
  });

  requestAnimationFrame(drawParticles);
}

drawParticles();


// ===== 4. DARK / LIGHT MODE =====
const themeToggle = document.getElementById('themeToggle');
const html        = document.documentElement;

themeToggle.addEventListener('click', () => {
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  themeToggle.textContent = isDark ? '☀️' : '🌙';
});


// ===== 5. HAMBURGER MENU =====
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navLinks.classList.toggle('open');
});

// Zatvorí menu po kliknutí na link
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
  });
});


// ===== 6. NAVBAR SCROLL EFEKT =====
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
  navbar.style.borderBottomColor = window.scrollY > 50 ? '#7c6dfa' : '#1e1e32';
});


// ===== 7. AKTÍVNY LINK V NAVIGÁCII =====
const sections = document.querySelectorAll('section');
const navItems = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
  let current = '';

  sections.forEach(section => {
    if (window.scrollY >= section.offsetTop - 100) {
      current = section.getAttribute('id');
    }
  });

  navItems.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('active');
    }
  });
});


// ===== 8. TYPING ANIMÁCIA =====
const texts   = ['Frontend Developer', 'Fullstack Developer', 'Web Enthusiast', 'UI Lover'];
const target  = document.getElementById('typingText');
let textIndex = 0;
let charIndex = 0;
let deleting  = false;

function type() {
  const current = texts[textIndex];

  if (!deleting) {
    target.textContent = current.slice(0, charIndex + 1);
    charIndex++;
    if (charIndex === current.length) {
      deleting = true;
      setTimeout(type, 1800);
      return;
    }
  } else {
    target.textContent = current.slice(0, charIndex - 1);
    charIndex--;
    if (charIndex === 0) {
      deleting  = false;
      textIndex = (textIndex + 1) % texts.length;
    }
  }

  setTimeout(type, deleting ? 60 : 100);
}

// Spustí typing po načítaní
setTimeout(type, 2200);


// ===== 9. SCROLL ANIMÁCIE =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.15 });

document.querySelectorAll('.about-inner, .skills-grid, .projects-grid, .timeline, .contact-inner').forEach(el => {
  el.classList.add('hidden');
  observer.observe(el);
});


// ===== 10. FORMSPREE FORMULÁR =====
const form = document.getElementById('contactForm');

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeInput(value) {
  // Odstráni HTML tagy
  let sanitized = value.replace(/<[^>]*>?/gm, '').trim();
  // Odstráni potenciálne nebezpečné schémy (javascript:, data:, atď.)
  sanitized = sanitized.replace(/(javascript|data|vbscript|on\w+):/gi, '');
  // Odstráni zakázané slová (napr. citlivé údaje ako heslo, karta)
  const forbiddenWords = /\b(password|credit.?card|ssn|social.?security|bank|account)\b/gi;
  sanitized = sanitized.replace(forbiddenWords, '[REDACTED]');
  // Obmedzí opakujúce sa znaky (napr. spam)
  sanitized = sanitized.replace(/(.)\1{10,}/g, '$1$1$1'); // Max 3 rovnaké znaky za sebou
  return sanitized;
}

form.addEventListener('submit', async (e) => {
  const btn = form.querySelector('.btn');

  // Rate limiting: max 3 pokusy za hodinu
  const now = Date.now();
  const attempts = JSON.parse(localStorage.getItem('formAttempts') || '[]');
  const recentAttempts = attempts.filter(time => now - time < 3600000); // 1 hodina
  if (recentAttempts.length >= 3) {
    e.preventDefault();
    alert('Príliš veľa pokusov. Skús znovu neskôr.');
    return;
  }
  recentAttempts.push(now);
  localStorage.setItem('formAttempts', JSON.stringify(recentAttempts));

  const honeypot = form['_gotcha']?.value || '';
  const name = sanitizeInput(form.name.value);
  const email = sanitizeInput(form.email.value);
  const message = sanitizeInput(form.message.value);

  if (honeypot) {
    // bot behavior detekovaný
    e.preventDefault();
    return;
  }

  if (!name || !email || !message) {
    e.preventDefault();
    alert('Vyplň všetky polia prosím.');
    return;
  }

  if (!isValidEmail(email)) {
    e.preventDefault();
    alert('Zadaj správny e-mail.');
    return;
  }

  if (message.length < 10) {
    e.preventDefault();
    alert('Správa musí mať aspoň 10 znakov.');
    return;
  }

  // Kontrola reCAPTCHA
  const recaptchaResponse = grecaptcha.getResponse();
  if (!recaptchaResponse) {
    e.preventDefault();
    alert('Prosím, dokončite reCAPTCHA.');
    return;
  }

  e.preventDefault();
  btn.textContent = 'Odosielam...';
  btn.disabled = true;

  const data = new FormData(form);

  try {
    const res = await fetch(form.action, {
      method:  'POST',
      body:    data,
      headers: { 'Accept': 'application/json' },
    });

    if (res.ok) {
      btn.textContent      = '✓ Odoslané!';
      btn.style.background = '#22c55e';
      form.reset();
    } else {
      btn.textContent      = '✗ Chyba, skús znova';
      btn.style.background = '#ef4444';
    }
  } catch {
    btn.textContent      = '✗ Chyba pripojenia';
    btn.style.background = '#ef4444';
  }

  setTimeout(() => {
    btn.textContent      = 'Odoslať';
    btn.style.background = '';
    btn.disabled         = false;
  }, 3000);
});