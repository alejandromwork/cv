/**
 * CV Version Controller
 * Manages CV content loading from local JSON
 */

class CVVersionController {
  constructor() {
    this.preloader = document.getElementById('preloader-overlay');
    this.currentVersion = this.detectVersionFromPath() || 'developer';
    this.cvData = null;
    this.allExperiences = null;
    this.allProjects = null;
    this.init();
  }

  detectVersionFromPath() {
    const path = window.location.pathname;
    const versionMap = {
      'data-science': 'data_science',
      'fintech': 'fintech',
      'fund-accounting': 'fund_accounting',
      'investment': 'investment_analysis',
      'finance': 'neutral_finance',
      'developer': 'pure_coding',
      'reporting-analyst': 'fund_accounting'
    };
    
    for (const [pathSegment] of Object.entries(versionMap)) {
      if (path.includes('/' + pathSegment + '/')) {
        console.log('Detected version from path:', pathSegment, '->', this.normalizeVersionKey(pathSegment));
        return pathSegment;
      }
    }
    return null;
  }

  normalizeVersionKey(version) {
    if (!version) return version;
    const versionMap = {
      'data-science': 'data_science',
      'data_science': 'data_science',
      'fintech': 'fintech',
      'fund-accounting': 'fund_accounting',
      'fund_accounting': 'fund_accounting',
      'investment': 'investment_analysis',
      'investment-analysis': 'investment_analysis',
      'investment_analysis': 'investment_analysis',
      'finance': 'neutral_finance',
      'neutral-finance': 'neutral_finance',
      'neutral_finance': 'neutral_finance',
      'developer': 'pure_coding',
      'pure-coding': 'pure_coding',
      'pure_coding': 'pure_coding',
      'reporting-analyst': 'reporting_analyst',
      'reporting_analyst': 'reporting_analyst'
    };
    if (versionMap[version]) return versionMap[version];
    return version.includes('-') ? version.replace(/-/g, '_') : version;
  }

  async init() {
    // Don't show preloader if in iframe (admin preview)
    if (window.self === window.top) {
      this.showPreloader();
    }
    this.loadVersionFromURL();
    await this.loadVersions();
    this.allExperiences = this.getAllExperiences();
    this.allProjects = this.getAllProjects();
    this.setupEventListeners();
    this.hidePreloader();
  }

  showPreloader() {
    if (this.preloader && window.self === window.top) {
      this.preloader.classList.remove('hidden');
    }
  }

  hidePreloader() {
    if (this.preloader) {
      this.preloader.classList.add('hidden');
    }
  }

  async loadVersions() {
    // Detect base path (handles GitHub Pages /cv/ path)
    const basePath = window.location.pathname.includes('/cv/') ? '/cv/' : '/';
    const dataPath = basePath === '/' ? 'assets/data/cv-data.json' : '/cv/assets/data/cv-data.json';
    
    try {
      const response = await fetch(dataPath);
      if (response.ok) {
        const localData = await response.json();
        this.cvData = localData;
        console.log('Loaded CV data from:', dataPath);
        this.populatePageWithData(localData);
        this.applyVersion(this.currentVersion);
      } else {
        console.error('Failed to load CV data from:', dataPath);
      }
    } catch (error) {
      console.error('Error loading CV data:', error);
    }
  }


  populatePageWithData(data) {
    console.log('Populating page with data:', data);
    
    // Update personal info
    if (data.personal) {
      const nameEl = document.querySelector('.name');
      if (nameEl && data.personal.name) nameEl.textContent = data.personal.name;
      
      // Try multiple selectors for job title (more flexible)
      const jobEl = document.querySelector('.job') || document.querySelector('.info p');
      if (jobEl && data.personal.jobTitle) jobEl.textContent = data.personal.jobTitle;
      
      const aboutEl = document.querySelector('.about p');
      if (aboutEl && data.personal.about) aboutEl.textContent = data.personal.about;
    }

    // Update contact info
    if (data.contact) {
      if (data.contact.phone) {
        const phoneEl = document.querySelector('.call a');
        if (phoneEl) {
          phoneEl.href = 'tel:' + data.contact.phone;
          phoneEl.querySelector('span').textContent = data.contact.phone;
        }
      }
      
      if (data.contact.email) {
        const emailEl = document.querySelector('.email a');
        if (emailEl) {
          emailEl.href = 'mailto:' + data.contact.email;
          emailEl.querySelector('span').textContent = data.contact.email;
        }
      }
      
      if (data.contact.location) {
        const locationEl = document.querySelector('.address span');
        if (locationEl) locationEl.textContent = data.contact.location;
      }
      
      if (data.contact.website) {
        const websiteEl = document.querySelector('.website-link a');
        if (websiteEl) {
          websiteEl.href = data.contact.website;
          websiteEl.querySelector('.website-text').textContent = 'Online CV';
        }
      }
    }

    // Update education
    if (data.education && Array.isArray(data.education)) {
      const eduList = document.querySelector('.edu ul');
      if (eduList) {
        eduList.innerHTML = '';
        data.education.forEach(edu => {
          const li = document.createElement('li');
          li.innerHTML = `
            <span>${edu.degree || ''}<br>${edu.school || ''}</span>
            <small>${edu.dates || ''}</small>
            ${edu.coursework && edu.coursework.length ? edu.coursework.map(c => 
              `<h6 class="coursework">${c}</h6>`
            ).join('') : ''}
          `;
          eduList.appendChild(li);
        });
      }
    }

    // Update work experience
    if (data.workExperience && Array.isArray(data.workExperience)) {
      const workList = document.querySelector('.work ul');
      if (workList) {
        workList.innerHTML = '';
        data.workExperience.forEach(work => {
          const li = document.createElement('li');
          li.innerHTML = `
            <span>${work.title || ''}</span>${work.company ? `<span class="highlight"> (${work.company})</span>` : ''}
            <small>${work.dates || ''}</small>
            ${work.description ? `<h6 class="coursework">${work.description}</h6>` : ''}
          `;
          workList.appendChild(li);
        });
      }
    }

    // Update skills
    if (data.skills && Array.isArray(data.skills)) {
      const skillsGrid = document.querySelector('.skills-grid');
      if (skillsGrid) {
        skillsGrid.innerHTML = '';
        data.skills.forEach(skill => {
          const skillDiv = document.createElement('div');
          skillDiv.className = 'skill';
          skillDiv.setAttribute('data-percent', skill.percent || 0);
          skillDiv.setAttribute('data-years', skill.years || 0);
          skillDiv.setAttribute('data-tags', (skill.tags || []).join(','));
          skillDiv.innerHTML = `
            <div class="skill-info">
              <div class="skill-name">${skill.name || ''}</div>
            </div>
            <div class="skill-meter" aria-hidden="true"><div class="skill-fill" style="width:0%"></div></div>
            <div class="skill-percent">${skill.percent || 0}%</div>
          `;
          skillsGrid.appendChild(skillDiv);
        });
        
        // Trigger skill animations
        setTimeout(() => {
          document.querySelectorAll('.skills-grid .skill').forEach((el, i) => {
            const percent = el.getAttribute('data-percent') || '0';
            const fill = el.querySelector('.skill-fill');
            const pct = Math.max(0, Math.min(100, parseInt(percent, 10) || 0));
            setTimeout(() => { fill.style.width = pct + '%'; }, 100 + (i * 80));
          });
        }, 100);
      }
    }

    // Update projects
    if (data.projects && Array.isArray(data.projects)) {
      const projectList = document.querySelector('.project-list');
      if (projectList) {
        projectList.innerHTML = '';
        // Filter projects: only show active projects
        const activeProjects = data.projects.filter(project => project.active !== false);
        activeProjects.forEach(project => {
          const li = document.createElement('li');
          li.className = 'project-item active';
          li.setAttribute('data-filter-item', '');
          li.setAttribute('data-category', project.filterCategory || 'web development');
          li.setAttribute('data-active', project.active !== false ? 'true' : 'false');
          
          const links = project.links || [];
          const mainLink = links[0] || { url: '#', text: 'View Project' };
          
          li.innerHTML = `
            <figure class="project-img">
              <a href="${mainLink.url}" class="project-eye-link" target="_blank">
                <div class="project-item-icon-box">
                  <i class="fas fa-eye"></i>
                </div>
                <img src="../assets/images/${project.image || 'placeholder.png'}" alt="${project.title}" loading="lazy">
              </a>
            </figure>
            <div class="project-info">
              <h3 class="project-title">
                <a href="${mainLink.url}" target="_blank">${project.title || ''}</a>
              </h3>
              <p class="project-description">${project.description || ''}</p>
              ${links.map(link => `<a href="${link.url}" class="project-link" target="_blank">${link.text}</a>`).join('')}
              <p class="project-category">${project.category || ''}</p>
            </div>
          `;
          projectList.appendChild(li);
        });
        console.log(`Loaded ${activeProjects.length} active projects out of ${data.projects.length} total`);
      }
    }

    // Update languages
    if (data.languages && Array.isArray(data.languages)) {
      const langContainer = document.querySelector('.interests-items');
      if (langContainer && langContainer.parentElement.querySelector('h3')?.textContent.includes('Languages')) {
        langContainer.innerHTML = '';
        data.languages.forEach(lang => {
          const div = document.createElement('div');
          div.className = 'language';
          div.innerHTML = `
            <img src="assets/images/${lang.flag}" alt="${lang.name}" class="flag">
            <span>${lang.name}</span>
          `;
          langContainer.appendChild(div);
        });
      }
    }
  }

  loadVersionFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const version = urlParams.get('version');
    if (version) {
      this.currentVersion = this.normalizeVersionKey(version);
    }
  }

  setupEventListeners() {
    // Version selector dropdown
    const versionSelector = document.getElementById('version-selector');
    if (versionSelector) {
      versionSelector.addEventListener('change', (e) => {
        this.switchVersion(e.target.value);
      });
    }

    // Quick action buttons
    document.querySelectorAll('.version-quick-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const version = e.currentTarget.dataset.version;
        this.switchVersion(version);
      });
    });
  }

  switchVersion(version) {
    // Version switching disabled - single version CV
    console.log('Version switching not available in single-version mode');
  }

  applyVersion(versionKey) {
    if (!this.cvData) {
      console.error('CVVersionController: CV data is not loaded.');
      return;
    }

    // Update document title
    const title = this.cvData.personalInfo?.name || 'Alejandro Moral Aranda';
    document.title = `${title} - CV`;

    // Data is already populated, just update title
    console.log('Version applied:', versionKey);
  }

  getAllExperiences() {
    const experiences = [];
    document.querySelectorAll('.work ul li').forEach(li => {
      const title = li.querySelector('span:first-child');
      if (title) {
        experiences.push({
          element: li,
          title: title.textContent.trim(),
          originalIndex: experiences.length
        });
      }
    });
    return experiences;
  }

  getAllProjects() {
    const projects = [];
    document.querySelectorAll('.project-item').forEach(item => {
      const title = item.querySelector('.project-title a');
      if (title) {
        projects.push({
          element: item,
          title: title.textContent.trim(),
          originalIndex: projects.length
        });
      }
    });
    return projects;
  }

  updateExperiences(orderArray) {
    const workList = document.querySelector('.work ul');
    if (!workList) return;

    // Hide all first
    this.allExperiences.forEach(exp => {
      exp.element.style.display = 'none';
    });

    // Show and reorder based on version
    const fragment = document.createDocumentFragment();
    orderArray.forEach(title => {
      const exp = this.allExperiences.find(e => e.title === title);
      if (exp) {
        exp.element.style.display = 'list-item';
        fragment.appendChild(exp.element);
      }
    });

    workList.innerHTML = '';
    workList.appendChild(fragment);
  }

  updateProjects(projectsToShow) {
    const projectList = document.querySelector('.project-list');
    if (!projectList) return;

    if (projectsToShow.includes('all')) {
      // Show all projects
      this.allProjects.forEach(proj => {
        proj.element.style.display = 'list-item';
      });
    } else {
      // Filter projects
      this.allProjects.forEach(proj => {
        if (projectsToShow.includes(proj.title)) {
          proj.element.style.display = 'list-item';
        } else {
          proj.element.style.display = 'none';
        }
      });
    }
  }

  applyFormalismTheme(formalism) {
    const body = document.body;
    
    // Remove existing formalism classes
    body.classList.remove('formalism-professional', 'formalism-balanced', 'formalism-modern', 'formalism-creative');
    
    // Add new formalism class
    body.classList.add(`formalism-${formalism}`);
  }

  highlightSkills(skillsArray) {
    // Remove all existing highlights
    document.querySelectorAll('.skill').forEach(skill => {
      skill.classList.remove('skill-highlighted');
    });

    // Add highlights to specified skills
    skillsArray.forEach(skillName => {
      const skillElement = Array.from(document.querySelectorAll('.skill')).find(el => {
        const name = el.querySelector('.skill-name');
        return name && name.textContent.trim() === skillName;
      });
      
      if (skillElement) {
        skillElement.classList.add('skill-highlighted');
      }
    });
  }

  updatePDFLink(versionKey) {
    const downloadBtn = document.querySelector('.download-btn');
    if (downloadBtn) {
      const fileName = `alejandro_moral_aranda_${versionKey.replace(/-/g, '_')}.pdf`;
      downloadBtn.setAttribute('href', fileName);
      downloadBtn.setAttribute('download', fileName);
    }
  }

  // Generate PDF for current version
  async generatePDF() {
    const versionKey = this.currentVersion;
    const fileName = `alejandro_moral_aranda_${versionKey.replace(/-/g, '_')}.pdf`;
    
    // Trigger PDF generation (assuming pdf-generator.js is loaded)
    if (window.generatePDF) {
      window.generatePDF(fileName);
    }
  }

  // Get current version info
  getCurrentVersion() {
    return {
      key: this.currentVersion,
      data: this.cvData
    };
  }

  // Get all available versions
  getAvailableVersions() {
    return [{
      key: this.currentVersion,
      title: 'Developer CV',
      formalism: 'professional'
    }];
  }
}

// Initialize when DOM is ready
let cvController;
document.addEventListener('DOMContentLoaded', function() {
  cvController = new CVVersionController();
});

// Make it globally accessible
window.CVVersionController = CVVersionController;
