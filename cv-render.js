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

    var avatarEl = document.querySelector(".resume_photo img");
    if (avatarEl && data.personal.avatarUrl && /^data:image\//.test(data.personal.avatarUrl)) {
      avatarEl.src = data.personal.avatarUrl;
    }

    // About
    var aboutEl = document.getElementById("cv-about");
    if (aboutEl) aboutEl.textContent = data.about;

    // Languages
    var langList = document.getElementById("cv-languages");
    if (langList) {
      langList.innerHTML = data.languages
        .map(function (lang) {
          var stars = "";
          for (var i = 1; i <= 5; i++) {
            stars +=
              i <= lang.level
                ? '<i class="fas fa-star"></i>'
                : '<i class="far fa-star"></i>';
          }
          return (
            "<li>" +
            '<div class="skill_name">' +
            escapeHtml(lang.name) +
            "</div>" +
            stars +
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
          var pct = parseInt(skill.percent, 10) || 0;
          return (
            "<li>" +
            '<div class="skill_name">' +
            escapeHtml(skill.name) +
            "</div>" +
            '<div class="skill_progress"><span style="width:' +
            pct +
            '%"></span></div>' +
            '<div class="skill_per">' +
            pct +
            "%</div>" +
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
            escapeHtml(exp.description) +
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
            escapeHtml(edu.description) +
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
