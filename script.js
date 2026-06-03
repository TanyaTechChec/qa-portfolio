'use strict';

document.addEventListener('DOMContentLoaded', () => {
  /* ================================================
     Utility
     ================================================ */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* ================================================
     Sticky nav + active link
     ================================================ */
  const nav = $('#nav');
  const navLinks = $$('.nav__link');
  const sections = $$('section[id], div[id]');

  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);

    // Active nav link via IntersectionObserver fallback via scroll
    const scrollY = window.scrollY + 100;
    sections.forEach((sec) => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      if (scrollY >= top && scrollY < top + height) {
        navLinks.forEach((l) => {
          l.classList.toggle('active', l.getAttribute('href') === `#${sec.id}`);
        });
      }
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ================================================
     Mobile menu
     ================================================ */
  const burger = $('#navBurger');
  const mobileMenu = $('#mobileMenu');

  burger.addEventListener('click', () => {
    const open = burger.classList.toggle('open');
    mobileMenu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
  });

  // Close on link click
  $$('.nav__link', mobileMenu).forEach((link) => {
    link.addEventListener('click', () => {
      burger.classList.remove('open');
      mobileMenu.classList.remove('open');
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && !mobileMenu.contains(e.target)) {
      burger.classList.remove('open');
      mobileMenu.classList.remove('open');
    }
  });

  /* ================================================
     Reveal on scroll
     ================================================ */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
  );

  $$('.reveal').forEach((el) => revealObserver.observe(el));

  /* ================================================
     Slider
     ================================================ */
  const sliderTrack = $('#sliderTrack');
  const slides = $$('.slider__slide');
  const sliderPrev = $('#sliderPrev');
  const sliderNext = $('#sliderNext');
  const sliderCurrent = $('#sliderCurrent');
  const sliderTotal = $('#sliderTotal');
  const sliderLabel = $('#sliderLabel');
  const sliderDotsContainer = $('#sliderDots');

  let currentIndex = 0;
  const totalSlides = slides.length;

  // Update total
  sliderTotal.textContent = totalSlides;

  // Create dots
  slides.forEach((slide, i) => {
    const dot = document.createElement('button');
    dot.classList.add('slider__dot');
    dot.setAttribute('aria-label', `Слайд ${i + 1}`);
    if (i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goToSlide(i));
    sliderDotsContainer.appendChild(dot);
  });

  const dots = $$('.slider__dot', sliderDotsContainer);

  function goToSlide(index) {
    currentIndex = (index + totalSlides) % totalSlides;
    sliderTrack.style.transform = `translateX(-${currentIndex * 100}%)`;
    sliderCurrent.textContent = currentIndex + 1;
    sliderLabel.textContent = slides[currentIndex].dataset.label || '';

    dots.forEach((d, i) => d.classList.toggle('active', i === currentIndex));
  }

  sliderNext.addEventListener('click', () => goToSlide(currentIndex + 1));
  sliderPrev.addEventListener('click', () => goToSlide(currentIndex - 1));

  // Swipe support
  let touchStartX = 0;
  let touchEndX = 0;

  sliderTrack.addEventListener(
    'touchstart',
    (e) => {
      touchStartX = e.changedTouches[0].clientX;
    },
    { passive: true },
  );

  sliderTrack.addEventListener(
    'touchend',
    (e) => {
      touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        goToSlide(diff > 0 ? currentIndex + 1 : currentIndex - 1);
      }
    },
    { passive: true },
  );

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') goToSlide(currentIndex + 1);
    if (e.key === 'ArrowLeft') goToSlide(currentIndex - 1);
    if (e.key === 'Escape') closeLightbox();
  });

  // Auto-advance (pauses on hover)
  let autoSlideInterval = setInterval(() => goToSlide(currentIndex + 1), 4500);

  const sliderEl = $('#slider');
  sliderEl.addEventListener('mouseenter', () => clearInterval(autoSlideInterval));
  sliderEl.addEventListener('mouseleave', () => {
    autoSlideInterval = setInterval(() => goToSlide(currentIndex + 1), 4500);
  });

  /* ================================================
     Lightbox
     ================================================ */
  const lightbox = $('#lightbox');
  const lightboxImg = $('#lightboxImg');
  const lightboxCaption = $('#lightboxCaption');
  const lightboxClose = $('#lightboxClose');
  const lightboxPrev = $('#lightboxPrev');
  const lightboxNext = $('#lightboxNext');

  function openLightbox(index) {
    const slide = slides[index];
    const img = slide.querySelector('img');
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightboxCaption.textContent = slide.dataset.label || img.alt;
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    currentIndex = index;
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  function lightboxNavigate(dir) {
    const newIndex = (currentIndex + dir + totalSlides) % totalSlides;
    goToSlide(newIndex);
    openLightbox(newIndex);
  }

  slides.forEach((slide, i) => {
    slide.addEventListener('click', () => openLightbox(i));
  });

  lightboxClose.addEventListener('click', closeLightbox);
  lightboxPrev.addEventListener('click', () => lightboxNavigate(-1));
  lightboxNext.addEventListener('click', () => lightboxNavigate(1));

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  /* ================================================
     Smooth scroll for nav links
     ================================================ */
  $$('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const target = $(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = target.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top: offset, behavior: 'smooth' });
    });
  });

  /* ================================================
     Skill chips stagger reveal
     ================================================ */
  const chipGroups = $$('.skill-group');
  const chipObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const chips = $$('.chip', entry.target);
          chips.forEach((chip, i) => {
            chip.style.transitionDelay = `${i * 40}ms`;
            chip.style.opacity = '1';
            chip.style.transform = 'translateY(0)';
          });
          chipObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 },
  );

  chipGroups.forEach((group) => {
    const chips = $$('.chip', group);
    chips.forEach((chip) => {
      chip.style.opacity = '0';
      chip.style.transform = 'translateY(10px)';
      chip.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    });
    chipObserver.observe(group);
  });

  /* ================================================
     Project cards tilt effect (subtle)
     ================================================ */
  $$('.project-card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `
        translateY(-6px)
        rotateX(${-y * 4}deg)
        rotateY(${x * 4}deg)
      `;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
    });

    card.addEventListener('mouseenter', () => {
      card.style.transition = 'box-shadow 0.3s ease, border-color 0.3s ease';
    });
  });

  /* ================================================
     Hero name animated entrance
     ================================================ */
  const heroName = $('.hero__name');
  if (heroName) {
    heroName.style.opacity = '0';
    heroName.style.transform = 'translateY(32px)';
    requestAnimationFrame(() => {
      heroName.style.transition =
        'opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.15s, transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.15s';
      heroName.style.opacity = '1';
      heroName.style.transform = 'translateY(0)';
    });
  }

  /* ================================================
     Nav progress indicator
     ================================================ */
  const progressBar = document.createElement('div');
  progressBar.style.cssText = `
    position: fixed;
    top: 64px;
    left: 0;
    height: 2px;
    background: linear-gradient(90deg, #C4A882, #7A7060);
    z-index: 101;
    width: 0%;
    transition: width 0.1s linear;
    pointer-events: none;
  `;
  document.body.appendChild(progressBar);

  window.addEventListener(
    'scroll',
    () => {
      const scrolled = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.width = `${(scrolled / total) * 100}%`;
    },
    { passive: true },
  );
});
/* ================================================
   Логотипы в карточках проектов — добавить в конец style.css
   ================================================ */

.project-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--sp-sm);
  gap: var(--sp-sm);
}

.project-card__logo {
  width: 52px;
  height: 52px;
  object-fit: contain;
  border-radius: var(--r-sm);
  flex-shrink: 0;
}

/* Логотип на светлом фоне (Only) */
.project-card__logo--light {
  background: #f2f2f2;
  padding: 4px;
  border-radius: var(--r-sm);
  border: 1px solid var(--clr-border-soft);
}

/* Логотип на тёмном фоне (Jobby) */
.project-card__logo--dark {
  border-radius: var(--r-md);
  overflow: hidden;
}

/* Плейсхолдер если нет лого (iOS карточка) */
.project-card__logo-placeholder {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  background: var(--clr-chip-bg);
  border-radius: var(--r-sm);
  flex-shrink: 0;
}

/* Тег (категория) теперь выравнивается справа */
.project-card__tag {
  text-align: right;
  flex: 1;
}