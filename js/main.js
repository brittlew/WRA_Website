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
