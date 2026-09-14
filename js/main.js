// Western Retirement Advisors — shared site behavior
document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Divider-strip parallax: the hero photo itself stays solid/static;
  // instead each thin photo strip between sections shifts slightly slower
  // than the page scrolls, so it reads as a moving layer peeking through as
  // you scroll by. The page can have more than one of these strips (e.g. one
  // below the hero, another below "How We Help"), so we track every
  // .mountain-divider on the page rather than assuming just one.
  // Skipped entirely for visitors who've asked for reduced motion.
  var dividerPairs = [];
  document.querySelectorAll('.mountain-divider').forEach(function (section) {
    var image = section.querySelector('.mountain-divider-image');
    if (image) {
      dividerPairs.push({ section: section, image: image });
    }
  });
  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (dividerPairs.length && !prefersReducedMotion) {
    var ticking = false;
    var updateParallax = function () {
      dividerPairs.forEach(function (pair) {
        var rect = pair.section.getBoundingClientRect();
        // Only bother once the divider has scrolled at least partly into view.
        if (rect.bottom > 0 && rect.top < window.innerHeight) {
          // Offset is based on the divider's own position in the viewport
          // (not raw page scroll position), so it's bounded and starts at 0
          // as the strip scrolls into view — avoids the image outrunning the
          // strip's cropped viewing window.
          var raw = (window.innerHeight - rect.top) * 0.12;
          var offset = Math.max(-35, Math.min(35, raw - 20));
          pair.image.style.transform = 'translateY(' + offset + 'px)';
        }
      });
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }, { passive: true });
    updateParallax();
  }

  // Mark current page's nav link active
  var here = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.main-nav a').forEach(function (link) {
    var href = link.getAttribute('href');
    if (href === here || (here === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // Basic client-side validation feedback before submit
  var forms = document.querySelectorAll('form');
  forms.forEach(function (form) {
    form.addEventListener('submit', function (e) {
      if (!form.checkValidity()) {
        e.preventDefault();
        form.reportValidity();
      }
    });
  });

  // Formspree forms: submit in the background and send the visitor to our own
  // branded thank-you page on success, instead of Formspree's generic one.
  // (Formspree's free plan no longer honors a redirect on plain form posts,
  // so we handle the redirect ourselves.)
  var formspreeForms = document.querySelectorAll('form[action*="formspree.io"]');
  formspreeForms.forEach(function (form) {
    form.addEventListener('submit', function (e) {
      if (!form.checkValidity()) {
        return; // the validation handler above already stopped this submit
      }
      e.preventDefault();

      var submitBtn = form.querySelector('button[type="submit"]');
      var originalBtnText = submitBtn ? submitBtn.textContent : '';
      var errorNote = form.querySelector('.form-error-note');
      var nextField = form.querySelector('input[name="_next"]');
      var destination = (nextField && nextField.value) ? nextField.value : 'thank-you.html';

      // Route California inquiries to WRA Insurance Solutions' own Formspree
      // form (its own inbox + destination email), everyone else to the
      // default Western Retirement Advisors form.
      var stateField = form.querySelector('#state');
      var caAction = form.getAttribute('data-ca-action');
      var isCalifornia = stateField && stateField.value === 'California';
      var submitUrl = (isCalifornia && caAction) ? caAction : form.action;

      var subjectField = form.querySelector('input[name="_subject"]');
      if (subjectField) {
        var caSubject = subjectField.getAttribute('data-ca-subject');
        var defaultSubject = subjectField.getAttribute('data-default-subject') || subjectField.defaultValue;
        subjectField.setAttribute('data-default-subject', defaultSubject);
        subjectField.value = (isCalifornia && caSubject) ? caSubject : defaultSubject;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';
      }
      if (errorNote) {
        errorNote.style.display = 'none';
      }

      fetch(submitUrl, {
        method: form.method || 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      }).then(function (response) {
        if (response.ok) {
          window.location.href = destination;
        } else {
          throw new Error('Formspree submission failed');
        }
      }).catch(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }
        if (errorNote) {
          errorNote.style.display = 'block';
        }
      });
    });
  });
});
