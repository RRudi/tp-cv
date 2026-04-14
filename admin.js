(function () {
  "use strict";

  // ── Stored SHA-256 hashes (password never in plaintext) ──────────────────
  var EXPECTED_LOGIN_HASH = "0cfcbf0e34abd78504fa0b4e6682033a62fedc4ce37890906d2cf6822f9647db";
  var EXPECTED_PWD_HASH   = "6f6cb0c9b3a058cf4b00a5fb2302057556a6c02f737249bc2d0acb14ad244642";

  // ── Helpers ───────────────────────────────────────────────────────────────
  function sha256(str) {
    var buf = new TextEncoder().encode(str);
    return crypto.subtle.digest("SHA-256", buf).then(function (hash) {
      return Array.from(new Uint8Array(hash))
        .map(function (b) { return b.toString(16).padStart(2, "0"); })
        .join("");
    });
  }

  function getData() {
    var stored = localStorage.getItem("cv_data");
    if (stored) {
      try { return JSON.parse(stored); } catch (e) {}
    }
    return JSON.parse(JSON.stringify(CV_DEFAULT_DATA));
  }

  function saveData(data) {
    localStorage.setItem("cv_data", JSON.stringify(data));
  }

  function showToast(msg, type) {
    var t = document.getElementById("toast");
    t.textContent = msg;
    t.className = "show " + (type || "success");
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.className = ""; }, 3000);
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  var loginForm     = document.getElementById("login-form");
  var loginError    = document.getElementById("login-error");
  var loginScreen   = document.getElementById("login-screen");
  var adminScreen   = document.getElementById("admin-screen");

  function checkSession() {
    if (sessionStorage.getItem("admin_logged") === "1") {
      loginScreen.style.display  = "none";
      adminScreen.style.display  = "flex";
      loadFormData();
    }
  }

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    loginError.textContent = "";
    var email = document.getElementById("login-email").value.trim();
    var pwd   = document.getElementById("login-password").value;

    Promise.all([sha256(email), sha256(pwd)]).then(function (hashes) {
      if (hashes[0] === EXPECTED_LOGIN_HASH && hashes[1] === EXPECTED_PWD_HASH) {
        sessionStorage.setItem("admin_logged", "1");
        loginScreen.style.display = "none";
        adminScreen.style.display = "flex";
        loadFormData();
      } else {
        loginError.textContent = "Identifiants incorrects. Veuillez réessayer.";
        document.getElementById("login-password").value = "";
      }
    });
  });

  document.getElementById("btn-logout").addEventListener("click", function () {
    sessionStorage.removeItem("admin_logged");
    adminScreen.style.display  = "none";
    loginScreen.style.display  = "flex";
    document.getElementById("login-email").value    = "";
    document.getElementById("login-password").value = "";
  });

  // ── Navigation ────────────────────────────────────────────────────────────
  var sidebarLinks = document.querySelectorAll("#sidebar-nav a");
  sidebarLinks.forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      var target = this.getAttribute("data-section");
      sidebarLinks.forEach(function (l) { l.classList.remove("active"); });
      this.classList.add("active");
      document.querySelectorAll(".admin-main .panel").forEach(function (p) {
        p.style.display = "none";
      });
      var section = document.getElementById("section-" + target);
      if (section) section.style.display = "block";
    });
  });

  // ── Save ──────────────────────────────────────────────────────────────────
  document.getElementById("btn-save").addEventListener("click", function () {
    saveData(collectFormData());
    showToast("✅ Données sauvegardées avec succès !", "success");
  });

  // ── Load data into forms ──────────────────────────────────────────────────
  function loadFormData() {
    var d = getData();

    // Personal
    document.getElementById("p-name").value    = d.personal.name    || "";
    document.getElementById("p-title").value   = d.personal.title   || "";
    document.getElementById("p-phone").value   = d.personal.phone   || "";
    document.getElementById("p-email").value   = d.personal.email   || "";
    document.getElementById("p-website").value = d.personal.website || "";
    document.getElementById("p-address").value = d.personal.address || "";

    var storedAvatar = d.personal.avatarUrl || "";
    var isValidAvatar = storedAvatar && /^data:image\//.test(storedAvatar);
    avatarPreview.src = isValidAvatar ? storedAvatar : "./images/avatar.png";
    avatarPreview.dataset.avatarUrl = isValidAvatar ? storedAvatar : "";

    // About
    document.getElementById("about-text").value = d.about || "";

    // Dynamic lists
    renderSkillsList(d.skills);
    renderLanguagesList(d.languages);
    renderSocialList(d.social);
    renderExperiencesList(d.experiences);
    renderEducationList(d.education);
    renderHobbiesList(d.hobbies);
  }

  // ── Collect data from forms ───────────────────────────────────────────────
  function collectFormData() {
    return {
      personal: {
        name:      document.getElementById("p-name").value.trim(),
        title:     document.getElementById("p-title").value.trim(),
        phone:     document.getElementById("p-phone").value.trim(),
        email:     document.getElementById("p-email").value.trim(),
        website:   document.getElementById("p-website").value.trim(),
        address:   document.getElementById("p-address").value.trim(),
        avatarUrl: document.getElementById("p-avatar-preview").dataset.avatarUrl || ""
      },
      about: document.getElementById("about-text").value.trim(),
      skills:      collectSkills(),
      languages:   collectLanguages(),
      social:      collectSocial(),
      experiences: collectExperiences(),
      education:   collectEducation(),
      hobbies:     collectHobbies()
    };
  }

  // ── Avatar upload ─────────────────────────────────────────────────────────
  var avatarFileInput = document.getElementById("p-avatar-file");
  var avatarPreview   = document.getElementById("p-avatar-preview");

  avatarFileInput.addEventListener("change", function () {
    var file = this.files && this.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("⚠️ Veuillez sélectionner un fichier image.", "error");
      return;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
      avatarPreview.src = e.target.result;
      avatarPreview.dataset.avatarUrl = e.target.result;
    };
    reader.onerror = function () {
      showToast("⚠️ Erreur lors de la lecture du fichier.", "error");
    };
    reader.readAsDataURL(file);
    // Reset value so the same file can be selected again
    this.value = "";
  });

  document.getElementById("p-avatar-reset").addEventListener("click", function () {
    avatarPreview.src = "./images/avatar.png";
    avatarPreview.dataset.avatarUrl = "";
  });

  // ── Skills ────────────────────────────────────────────────────────────────
  function renderSkillsList(skills) {
    var container = document.getElementById("skills-list");
    container.innerHTML = "";
    (skills || []).forEach(function (skill, idx) {
      container.appendChild(createSkillItem(skill, idx));
    });
  }

  function createSkillItem(skill, idx) {
    var div = document.createElement("div");
    div.className = "list-item";
    div.dataset.idx = idx;
    var pct = parseInt(skill.percent, 10) || 0;
    div.innerHTML =
      '<div class="item-header">' +
        '<span>Compétence #' + (idx + 1) + '</span>' +
        '<button class="btn-icon remove-skill" title="Supprimer"><i class="fas fa-trash-alt"></i></button>' +
      '</div>' +
      '<div class="item-grid">' +
        '<div class="form-group">' +
          '<label>Nom</label>' +
          '<input type="text" class="skill-name" value="' + escapeHtml(skill.name) + '" />' +
        '</div>' +
        '<div class="form-group">' +
          '<label>Niveau (%)</label>' +
          '<div class="range-wrapper">' +
            '<input type="range" min="0" max="100" step="5" class="skill-percent" value="' + pct + '" />' +
            '<span class="range-value">' + pct + '%</span>' +
          '</div>' +
        '</div>' +
      '</div>';
    div.querySelector(".skill-percent").addEventListener("input", function () {
      div.querySelector(".range-value").textContent = this.value + "%";
    });
    div.querySelector(".remove-skill").addEventListener("click", function () {
      div.remove();
      renumberItems("skills-list", "Compétence");
    });
    return div;
  }

  function collectSkills() {
    return Array.from(document.querySelectorAll("#skills-list .list-item")).map(function (item) {
      return {
        name:    item.querySelector(".skill-name").value.trim(),
        percent: parseInt(item.querySelector(".skill-percent").value, 10) || 0
      };
    });
  }

  document.getElementById("add-skill").addEventListener("click", function () {
    var container = document.getElementById("skills-list");
    var idx = container.querySelectorAll(".list-item").length;
    container.appendChild(createSkillItem({ name: "", percent: 50 }, idx));
  });

  // ── Languages ─────────────────────────────────────────────────────────────
  function renderLanguagesList(langs) {
    var container = document.getElementById("languages-list");
    container.innerHTML = "";
    (langs || []).forEach(function (lang, idx) {
      container.appendChild(createLanguageItem(lang, idx));
    });
  }

  function createLanguageItem(lang, idx) {
    var div = document.createElement("div");
    div.className = "list-item";
    div.dataset.idx = idx;
    var level = parseInt(lang.level, 10) || 1;
    var stars = "";
    for (var i = 1; i <= 5; i++) {
      stars += '<i class="' + (i <= level ? "fas" : "far") + ' fa-star" data-val="' + i + '"></i>';
    }
    div.innerHTML =
      '<div class="item-header">' +
        '<span>Langue #' + (idx + 1) + '</span>' +
        '<button class="btn-icon remove-lang" title="Supprimer"><i class="fas fa-trash-alt"></i></button>' +
      '</div>' +
      '<div class="item-grid">' +
        '<div class="form-group">' +
          '<label>Nom</label>' +
          '<input type="text" class="lang-name" value="' + escapeHtml(lang.name) + '" />' +
        '</div>' +
        '<div class="form-group">' +
          '<label>Niveau (étoiles)</label>' +
          '<div class="star-rating" data-value="' + level + '">' + stars + '</div>' +
        '</div>' +
      '</div>';

    var rating = div.querySelector(".star-rating");
    rating.querySelectorAll("i").forEach(function (star) {
      star.addEventListener("click", function () {
        var val = parseInt(this.getAttribute("data-val"), 10);
        rating.setAttribute("data-value", val);
        rating.querySelectorAll("i").forEach(function (s) {
          var sv = parseInt(s.getAttribute("data-val"), 10);
          s.className = (sv <= val ? "fas" : "far") + " fa-star";
        });
      });
    });

    div.querySelector(".remove-lang").addEventListener("click", function () {
      div.remove();
      renumberItems("languages-list", "Langue");
    });
    return div;
  }

  function collectLanguages() {
    return Array.from(document.querySelectorAll("#languages-list .list-item")).map(function (item) {
      return {
        name:  item.querySelector(".lang-name").value.trim(),
        level: parseInt(item.querySelector(".star-rating").getAttribute("data-value"), 10) || 1
      };
    });
  }

  document.getElementById("add-language").addEventListener("click", function () {
    var container = document.getElementById("languages-list");
    var idx = container.querySelectorAll(".list-item").length;
    container.appendChild(createLanguageItem({ name: "", level: 3 }, idx));
  });

  // ── Social ────────────────────────────────────────────────────────────────
  function renderSocialList(social) {
    var container = document.getElementById("social-list");
    container.innerHTML = "";
    (social || []).forEach(function (s, idx) {
      container.appendChild(createSocialItem(s, idx));
    });
  }

  function createSocialItem(s, idx) {
    var div = document.createElement("div");
    div.className = "list-item";
    div.dataset.idx = idx;
    div.innerHTML =
      '<div class="item-header">' +
        '<span>Réseau #' + (idx + 1) + '</span>' +
        '<button class="btn-icon remove-social" title="Supprimer"><i class="fas fa-trash-alt"></i></button>' +
      '</div>' +
      '<div class="item-grid">' +
        '<div class="form-group">' +
          '<label>Nom</label>' +
          '<input type="text" class="social-name" value="' + escapeHtml(s.name) + '" />' +
        '</div>' +
        '<div class="form-group">' +
          '<label>Handle / Identifiant</label>' +
          '<input type="text" class="social-handle" value="' + escapeHtml(s.handle) + '" />' +
        '</div>' +
        '<div class="form-group full-width">' +
          '<label>Icône FontAwesome (ex: fab fa-linkedin)</label>' +
          '<input type="text" class="social-icon" value="' + escapeHtml(s.icon) + '" />' +
        '</div>' +
      '</div>';
    div.querySelector(".remove-social").addEventListener("click", function () {
      div.remove();
      renumberItems("social-list", "Réseau");
    });
    return div;
  }

  function collectSocial() {
    return Array.from(document.querySelectorAll("#social-list .list-item")).map(function (item) {
      return {
        name:   item.querySelector(".social-name").value.trim(),
        handle: item.querySelector(".social-handle").value.trim(),
        icon:   item.querySelector(".social-icon").value.trim()
      };
    });
  }

  document.getElementById("add-social").addEventListener("click", function () {
    var container = document.getElementById("social-list");
    var idx = container.querySelectorAll(".list-item").length;
    container.appendChild(createSocialItem({ name: "", handle: "", icon: "fab fa-" }, idx));
  });

  // ── Experiences ───────────────────────────────────────────────────────────
  function renderExperiencesList(experiences) {
    var container = document.getElementById("experiences-list");
    container.innerHTML = "";
    (experiences || []).forEach(function (exp, idx) {
      container.appendChild(createExperienceItem(exp, idx));
    });
  }

  function createExperienceItem(exp, idx) {
    var div = document.createElement("div");
    div.className = "list-item";
    div.dataset.idx = idx;
    div.innerHTML =
      '<div class="item-header">' +
        '<span>Expérience #' + (idx + 1) + '</span>' +
        '<button class="btn-icon remove-exp" title="Supprimer"><i class="fas fa-trash-alt"></i></button>' +
      '</div>' +
      '<div class="item-grid">' +
        '<div class="form-group">' +
          '<label>Dates (ex: 2020 - Aujourd\'hui)</label>' +
          '<input type="text" class="exp-dates" value="' + escapeHtml(exp.dates) + '" />' +
        '</div>' +
        '<div class="form-group">' +
          '<label>Titre du poste</label>' +
          '<input type="text" class="exp-title" value="' + escapeHtml(exp.title) + '" />' +
        '</div>' +
        '<div class="form-group full-width">' +
          '<label>Description</label>' +
          '<textarea class="exp-desc">' + escapeHtml(exp.description) + '</textarea>' +
        '</div>' +
      '</div>';
    div.querySelector(".remove-exp").addEventListener("click", function () {
      div.remove();
      renumberItems("experiences-list", "Expérience");
    });
    return div;
  }

  function collectExperiences() {
    return Array.from(document.querySelectorAll("#experiences-list .list-item")).map(function (item) {
      return {
        dates:       item.querySelector(".exp-dates").value.trim(),
        title:       item.querySelector(".exp-title").value.trim(),
        description: item.querySelector(".exp-desc").value.trim()
      };
    });
  }

  document.getElementById("add-experience").addEventListener("click", function () {
    var container = document.getElementById("experiences-list");
    var idx = container.querySelectorAll(".list-item").length;
    container.appendChild(createExperienceItem({ dates: "", title: "", description: "" }, idx));
  });

  // ── Education ─────────────────────────────────────────────────────────────
  function renderEducationList(education) {
    var container = document.getElementById("education-list");
    container.innerHTML = "";
    (education || []).forEach(function (edu, idx) {
      container.appendChild(createEducationItem(edu, idx));
    });
  }

  function createEducationItem(edu, idx) {
    var div = document.createElement("div");
    div.className = "list-item";
    div.dataset.idx = idx;
    div.innerHTML =
      '<div class="item-header">' +
        '<span>Formation #' + (idx + 1) + '</span>' +
        '<button class="btn-icon remove-edu" title="Supprimer"><i class="fas fa-trash-alt"></i></button>' +
      '</div>' +
      '<div class="item-grid">' +
        '<div class="form-group">' +
          '<label>Dates (ex: 2010 - 2013)</label>' +
          '<input type="text" class="edu-dates" value="' + escapeHtml(edu.dates) + '" />' +
        '</div>' +
        '<div class="form-group">' +
          '<label>Titre / Diplôme</label>' +
          '<input type="text" class="edu-title" value="' + escapeHtml(edu.title) + '" />' +
        '</div>' +
        '<div class="form-group full-width">' +
          '<label>Description</label>' +
          '<textarea class="edu-desc">' + escapeHtml(edu.description) + '</textarea>' +
        '</div>' +
      '</div>';
    div.querySelector(".remove-edu").addEventListener("click", function () {
      div.remove();
      renumberItems("education-list", "Formation");
    });
    return div;
  }

  function collectEducation() {
    return Array.from(document.querySelectorAll("#education-list .list-item")).map(function (item) {
      return {
        dates:       item.querySelector(".edu-dates").value.trim(),
        title:       item.querySelector(".edu-title").value.trim(),
        description: item.querySelector(".edu-desc").value.trim()
      };
    });
  }

  document.getElementById("add-education").addEventListener("click", function () {
    var container = document.getElementById("education-list");
    var idx = container.querySelectorAll(".list-item").length;
    container.appendChild(createEducationItem({ dates: "", title: "", description: "" }, idx));
  });

  // ── Hobbies ───────────────────────────────────────────────────────────────
  function renderHobbiesList(hobbies) {
    var container = document.getElementById("hobbies-list");
    container.innerHTML = "";
    (hobbies || []).forEach(function (h, idx) {
      container.appendChild(createHobbyItem(h, idx));
    });
  }

  function createHobbyItem(h, idx) {
    var div = document.createElement("div");
    div.className = "list-item";
    div.dataset.idx = idx;
    div.innerHTML =
      '<div class="item-header">' +
        '<span>Hobby #' + (idx + 1) + '</span>' +
        '<button class="btn-icon remove-hobby" title="Supprimer"><i class="fas fa-trash-alt"></i></button>' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Icône FontAwesome (ex: fas fa-film)</label>' +
        '<input type="text" class="hobby-icon" value="' + escapeHtml(h.icon) + '" />' +
      '</div>';
    div.querySelector(".remove-hobby").addEventListener("click", function () {
      div.remove();
      renumberItems("hobbies-list", "Hobby");
    });
    return div;
  }

  function collectHobbies() {
    return Array.from(document.querySelectorAll("#hobbies-list .list-item")).map(function (item) {
      return { icon: item.querySelector(".hobby-icon").value.trim() };
    });
  }

  document.getElementById("add-hobby").addEventListener("click", function () {
    var container = document.getElementById("hobbies-list");
    var idx = container.querySelectorAll(".list-item").length;
    container.appendChild(createHobbyItem({ icon: "fas fa-" }, idx));
  });

  // ── Renumber helper ───────────────────────────────────────────────────────
  function renumberItems(containerId, label) {
    var items = document.querySelectorAll("#" + containerId + " .list-item");
    items.forEach(function (item, i) {
      var header = item.querySelector(".item-header span");
      if (header) header.textContent = label + " #" + (i + 1);
    });
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  checkSession();
})();
