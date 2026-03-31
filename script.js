// ===== 1. LOADING SCREEN =====
// Počká na načítanie stránky a potom skryje loading screen
window.addEventListener('load', () => {
  // Oneskorenie 2 sekundy pred skrytím
  setTimeout(() => {
    // Pridá triedu 'hidden' na loader element
    document.getElementById('loader').classList.add('hidden');
  }, 2000);
});


// ===== 2. CUSTOM CURSOR =====
// Získa referencie na elementy kurzora
const cursor    = document.getElementById('cursor');
const cursorDot = document.getElementById('cursorDot');

// Sleduje pohyb myši a aktualizuje pozíciu kurzora
document.addEventListener('mousemove', (e) => {
  // Nastaví pozíciu veľkého kurzora
  cursor.style.left    = e.clientX + 'px';
  cursor.style.top     = e.clientY + 'px';
  // Nastaví pozíciu malého bodu
  cursorDot.style.left = e.clientX + 'px';
  cursorDot.style.top  = e.clientY + 'px';
});

// Zväčší cursor keď ho dáš na klikateľný prvok
// Pre každý klikateľný element pridá event listenery
document.querySelectorAll('a, button, .skill-card, .project-card, .stat-box').forEach(el => {
  // Pri vstupe myši na element zväčší kurzor
  el.addEventListener('mouseenter', () => cursor.classList.add('expand'));
  // Pri opustení elementu zmenší kurzor
  el.addEventListener('mouseleave', () => cursor.classList.remove('expand'));
});


// ===== 3. PARTICLES =====
// Získa canvas element a jeho kontext
const canvas = document.getElementById('particles');
const ctx    = canvas.getContext('2d');

// Nastaví veľkosť canvas na veľkosť okna
canvas.width  = window.innerWidth;
canvas.height = window.innerHeight;

// Aktualizuje veľkosť canvas pri zmene veľkosti okna
window.addEventListener('resize', () => {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
});

// Počet častíc
const particleCount = 70;
// Pole pre uloženie častíc
const particles = [];

// Vytvorí častice s náhodnými vlastnosťami
for (let i = 0; i < particleCount; i++) {
  particles.push({
    x:       Math.random() * canvas.width,  // Náhodná x pozícia
    y:       Math.random() * canvas.height, // Náhodná y pozícia
    vx:      (Math.random() - 0.5) * 0.4,   // Rýchlosť v x smere
    vy:      (Math.random() - 0.5) * 0.4,   // Rýchlosť v y smere
    radius:  Math.random() * 1.5 + 0.5,     // Polomer častice
    opacity: Math.random() * 0.5 + 0.1,     // Priehľadnosť
  });
}

// Funkcia na kreslenie častíc
function drawParticles() {
  // Vymaže canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Pre každú časticu
  particles.forEach(p => {
    // Pohyb častice
    p.x += p.vx;
    p.y += p.vy;

    // Odraz od okrajov
    if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

    // Kreslenie častice
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(124, 109, 250, ${p.opacity})`;
    ctx.fill();
  });

  // Čiary medzi blízkymi particles
  particles.forEach((a, i) => {
    particles.slice(i + 1).forEach(b => {
      // Vypočíta vzdialenosť medzi časticami
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (dist < 100) {
        // Nakreslí čiaru ak sú blízko
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(124, 109, 250, ${0.15 * (1 - dist / 100)})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    });
  });

  // Rekurzívne volanie pre animáciu
  requestAnimationFrame(drawParticles);
}

// Spustí kreslenie častíc
drawParticles();


// ===== 4. DARK / LIGHT MODE =====
// Získa tlačidlo na prepnutie témy a HTML element
const themeToggle = document.getElementById('themeToggle');
const html        = document.documentElement;

// Pridá event listener na kliknutie tlačidla
themeToggle.addEventListener('click', () => {
  // Zistí aktuálnu tému
  const isDark = html.getAttribute('data-theme') === 'dark';
  // Prepne tému
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  // Zmení text tlačidla
  themeToggle.textContent = isDark ? '☀️' : '🌙';
});


// ===== 5. HAMBURGER MENU =====
// Získa hamburger tlačidlo a navigačné odkazy
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');

// Pridá event listener na kliknutie hamburger tlačidla
hamburger.addEventListener('click', () => {
  // Prepne triedu 'open' na hamburger a nav links
  hamburger.classList.toggle('open');
  navLinks.classList.toggle('open');
});

// Zatvorí menu po kliknutí na link
// Pre každý odkaz v nav links
navLinks.querySelectorAll('a').forEach(link => {
  // Pridá event listener na kliknutie
  link.addEventListener('click', () => {
    // Odstráni triedu 'open' z hamburger a nav links
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
  });
});


// ===== 6. NAVBAR SCROLL EFEKT =====
// Získa navigačnú lištu
const navbar = document.querySelector('.navbar');

// Pridá event listener na scroll
window.addEventListener('scroll', () => {
  // Zmení farbu spodného okraja podľa pozície scroll
  navbar.style.borderBottomColor = window.scrollY > 50 ? '#7c6dfa' : '#1e1e32';
});


// ===== 7. AKTÍVNY LINK V NAVIGÁCII =====
// Získa všetky sekcie a navigačné odkazy
const sections = document.querySelectorAll('section');
const navItems = document.querySelectorAll('.nav-links a');

// Pridá event listener na scroll
window.addEventListener('scroll', () => {
  // Premenná pre aktuálnu sekciu
  let current = '';

  // Pre každú sekciu
  sections.forEach(section => {
    // Ak je scroll pozícia väčšia ako offset sekcie mínus 100px
    if (window.scrollY >= section.offsetTop - 100) {
      // Nastaví aktuálnu sekciu
      current = section.getAttribute('id');
    }
  });

  // Pre každý navigačný odkaz
  navItems.forEach(link => {
    // Odstráni triedu 'active'
    link.classList.remove('active');
    // Ak href odkazu zodpovedá aktuálnej sekcii
    if (link.getAttribute('href') === `#${current}`) {
      // Pridá triedu 'active'
      link.classList.add('active');
    }
  });
});


// ===== 8. TYPING ANIMÁCIA =====
// Pole textov na typing
const texts   = ['Frontend Developer', 'Fullstack Developer', 'Web Enthusiast', 'UI Lover'];
// Element kde sa zobrazuje text
const target  = document.getElementById('typingText');
// Index aktuálneho textu
let textIndex = 0;
// Index aktuálneho znaku
let charIndex = 0;
// Flag či sa mažú znaky
let deleting  = false;

// Funkcia na typing animáciu
function type() {
  // Získa aktuálny text
  const current = texts[textIndex];

  if (!deleting) {
    // Ak sa nepíšu znaky, pridá ďalší znak
    target.textContent = current.slice(0, charIndex + 1);
    charIndex++;
    if (charIndex === current.length) {
      // Ak je koniec textu, začne mazať
      deleting = true;
      setTimeout(type, 1800);
      return;
    }
  } else {
    // Ak sa mažú znaky, odstráni posledný znak
    target.textContent = current.slice(0, charIndex - 1);
    charIndex--;
    if (charIndex === 0) {
      // Ak je text prázdny, prepne na ďalší text
      deleting  = false;
      textIndex = (textIndex + 1) % texts.length;
    }
  }

  // Rekurzívne volanie s oneskorením
  setTimeout(type, deleting ? 60 : 100);
}

// Spustí typing po načítaní
setTimeout(type, 2200);


// ===== 9. SCROLL ANIMÁCIE =====
// Vytvorí IntersectionObserver pre animácie pri scroll
const observer = new IntersectionObserver((entries) => {
  // Pre každú položku v entries
  entries.forEach(entry => {
    // Ak je element viditeľný
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.15 });

// Pozoruje elementy pre animácie
document.querySelectorAll('.about-inner, .skills-grid, .projects-grid, .timeline, .contact-inner').forEach(el => {
  // Pridá triedu 'hidden' a pozoruje element
  el.classList.add('hidden');
  observer.observe(el);
});


// ===== 10. FORMSPREE FORMULÁR =====
// Získa kontaktný formulár
const form = document.getElementById('contactForm');

// Funkcia na validáciu emailu
function isValidEmail(email) {
  // Regex pre kontrolu email formátu
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Funkcia na sanitizáciu vstupu
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

// Pridá event listener na odoslanie formulára
form.addEventListener('submit', async (e) => {
  // Získa tlačidlo formulára
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

  // Sanitizácia vstupov
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
    // Odošle formulár na Formspree
    const res = await fetch(form.action, {
      method:  'POST',
      body:    data,
      headers: { 'Accept': 'application/json' },
    });

    if (res.ok) {
      // Úspech
      btn.textContent      = '✓ Odoslané!';
      btn.style.background = '#22c55e';
      form.reset();
    } else {
      // Chyba
      btn.textContent      = '✗ Chyba, skús znova';
      btn.style.background = '#ef4444';
    }
  } catch {
    // Sieťová chyba
    btn.textContent      = '✗ Chyba pripojenia';
    btn.style.background = '#ef4444';
  }

  // Reset tlačidla po 3 sekundách
  setTimeout(() => {
    btn.textContent      = 'Odoslať';
    btn.style.background = '';
    btn.disabled         = false;
  }, 3000);
});