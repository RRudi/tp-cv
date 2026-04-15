(function () {
  function getData() {
    var stored = localStorage.getItem("cv_data");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return CV_DEFAULT_DATA;
      }
    }
    return CV_DEFAULT_DATA;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function render() {
    var data = getData();

    // Personal info
    var nameEl = document.getElementById("cv-name");
    var titleEl = document.getElementById("cv-title");
    var addressEl = document.getElementById("cv-address");
    var phoneEl = document.getElementById("cv-phone");
    var emailEl = document.getElementById("cv-email");
    var websiteEl = document.getElementById("cv-website");

    if (nameEl) nameEl.textContent = data.personal.name;
    if (titleEl) titleEl.textContent = data.personal.title;
    if (addressEl) addressEl.innerHTML = escapeHtml(data.personal.address).replace(/\n/g, "<br>");
    if (phoneEl) phoneEl.textContent = data.personal.phone;
    if (emailEl) emailEl.textContent = data.personal.email;
    if (websiteEl) websiteEl.textContent = data.personal.website;

    var photoEl = document.querySelector(".resume_photo");
    var avatarEl = document.querySelector(".resume_photo img");
    if (photoEl && avatarEl) {
      if (data.personal.avatarUrl && /^data:image\//.test(data.personal.avatarUrl)) {
        avatarEl.src = data.personal.avatarUrl;
        photoEl.style.display = "";
      } else {
        photoEl.style.display = "none";
      }
    }

    // About
    var aboutEl = document.getElementById("cv-about");
    if (aboutEl) aboutEl.textContent = data.about;

    // Languages
    var langList = document.getElementById("cv-languages");
    if (langList) {
      langList.innerHTML = data.languages
        .map(function (lang) {
          return (
            "<li>" +
            '<div class="skill_name">' +
            escapeHtml(lang.name) +
            "</div>" +
            '<div class="lang-description">' +
            escapeHtml(lang.description || "") +
            "</div>" +
            "</li>"
          );
        })
        .join("");
    }

    // Skills
    var skillsList = document.getElementById("cv-skills");
    if (skillsList) {
      skillsList.innerHTML = data.skills
        .map(function (skill) {
          return (
            "<li>" +
            '<div class="skill_name">' +
            escapeHtml(skill.category || "") +
            "</div>" +
            '<div class="skill_items">' +
            escapeHtml(skill.items || "") +
            "</div>" +
            "</li>"
          );
        })
        .join("");
    }

    // Social
    var socialList = document.getElementById("cv-social");
    if (socialList) {
      socialList.innerHTML = data.social
        .map(function (s) {
          return (
            "<li>" +
            '<div class="icon"><i class="' +
            escapeHtml(s.icon) +
            '"></i></div>' +
            '<div class="data">' +
            '<p class="semi-bold">' +
            escapeHtml(s.name) +
            "</p>" +
            "<p>" +
            escapeHtml(s.handle) +
            "</p>" +
            "</div>" +
            "</li>"
          );
        })
        .join("");
    }

    // Experiences
    var expList = document.getElementById("cv-experiences");
    if (expList) {
      expList.innerHTML = data.experiences
        .map(function (exp) {
          return (
            "<li>" +
            '<div class="date">' +
            escapeHtml(exp.dates) +
            "</div>" +
            '<div class="info">' +
            '<p class="semi-bold">' +
            escapeHtml(exp.title) +
            "</p>" +
            "<p>" +
            DOMPurify.sanitize(exp.description || "") +
            "</p>" +
            "</div>" +
            "</li>"
          );
        })
        .join("");
    }

    // Education
    var eduList = document.getElementById("cv-education");
    if (eduList) {
      eduList.innerHTML = data.education
        .map(function (edu) {
          return (
            "<li>" +
            '<div class="date">' +
            escapeHtml(edu.dates) +
            "</div>" +
            '<div class="info">' +
            '<p class="semi-bold">' +
            escapeHtml(edu.title) +
            "</p>" +
            "<p>" +
            DOMPurify.sanitize(edu.description || "") +
            "</p>" +
            "</div>" +
            "</li>"
          );
        })
        .join("");
    }

    // Hobbies
    var hobbiesList = document.getElementById("cv-hobbies");
    if (hobbiesList) {
      hobbiesList.innerHTML = data.hobbies
        .map(function (h) {
          return '<li><i class="' + escapeHtml(h.icon) + '"></i></li>';
        })
        .join("");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
