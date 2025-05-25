document.addEventListener('DOMContentLoaded', () => {
    const portfolioDataString = localStorage.getItem('portfolioData');

    if (!portfolioDataString) {
        // Redirect to upload page if no data is found, or display a message
        const container = document.querySelector('.portfolio-container');
        if (container) {
            container.innerHTML = `
                <h1>No Portfolio Data Found</h1>
                <p>Please <a href="index.html">upload your portfolio JSON file</a> first.</p>
            `;
        }
        return;
    }

    try {
        const data = JSON.parse(portfolioDataString);

        // Helper function to set text content if element exists
        const setText = (id, value) => {
            const element = document.getElementById(id);
            if (element && value) element.textContent = value;
        };

        // Helper function to set href if element exists
        const setLink = (id, value, textValue) => {
            const element = document.getElementById(id);
            if (element && value) {
                element.href = value;
                if (textValue) element.textContent = textValue;
            }
        };

        // Populate Basic Info
        if (data['image-url']) {
            const imgElement = document.getElementById('profileImage');
            if (imgElement) imgElement.src = data['image-url'];
        }
        setText('name', data.name);
        setText('headline', data['head-line']);
        setText('address', data.address);
        setLink('email', `mailto:${data.email}`, data.email);
        setText('phone', data.phone);

        // Populate Objective
        setText('objective', data.objective);

        // Populate Experience Summary
        if (data.experience) {
            setText('totalExp', data.experience['total-exp']);
            setText('relevantExp', data.experience['relevant-exp']);
        }

        // Populate Employment History
        const empHistoryContainer = document.getElementById('employmentHistoryContainer');
        if (empHistoryContainer && data['employment-history'] && Array.isArray(data['employment-history'])) {
            data['employment-history'].forEach(org => {
                const orgDiv = document.createElement('div');
                orgDiv.className = 'employment-item';
                orgDiv.innerHTML = `<h3>${org.organization} (${org.duration})</h3>`;
                if (org.history && Array.isArray(org.history)) {
                    org.history.forEach(job => {
                        orgDiv.innerHTML += `
                            <h4>${job.designation} (${job.duration}) - ${job.role}</h4>
                            <p><strong>Contribution:</strong> ${job.contribution || 'N/A'}</p>
                            <p><strong>Technologies:</strong> ${job['technology-used'] || 'N/A'}</p>
                            ${job['core-responsibility'] && Array.isArray(job['core-responsibility']) ?
                                `<h5>Core Responsibilities:</h5>
                                <ul>${job['core-responsibility'].map(resp => `<li>${resp}</li>`).join('')}</ul>`
                                : ''
                            }
                        `;
                    });
                }
                empHistoryContainer.appendChild(orgDiv);
            });
        }

        // Populate Technical Skills
        const techSkillsContainer = document.getElementById('technicalSkillsContainer');
        if (techSkillsContainer && data['technical-skill']) {
            let skillsHTML = '<ul>';
            for (const category in data['technical-skill']) {
                skillsHTML += `<li><strong>${category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> ${data['technical-skill'][category]}</li>`;
            }
            skillsHTML += '</ul>';
            techSkillsContainer.innerHTML = skillsHTML;
        }

        // Populate Academics
        const academicsContainer = document.getElementById('academicsContainer');
        if (academicsContainer && data.academics && Array.isArray(data.academics)) {
            data.academics.forEach(edu => {
                const eduDiv = document.createElement('div');
                eduDiv.className = 'academic-item';
                eduDiv.innerHTML = `
                    <h4>${edu.course} in ${edu.major}</h4>
                    <p>${edu.institute} - Passed in ${edu['pass-year']}</p>
                `;
                academicsContainer.appendChild(eduDiv);
            });
        }

        // Populate Languages
        const langContainer = document.getElementById('languagesContainer');
        if (langContainer && data.languages && Array.isArray(data.languages)) {
            data.languages.forEach(lang => {
                const li = document.createElement('li');
                li.textContent = lang;
                langContainer.appendChild(li);
            });
        }

        // Populate Online Presence
        const onlinePresenceContainer = document.getElementById('onlinePresenceContainer');
        if (onlinePresenceContainer && data['online-presence']) {
            let presenceHTML = '<ul>';
            for (const site in data['online-presence']) {
                if (data['online-presence'][site]) {
                    presenceHTML += `<li><a href="${data['online-presence'][site]}" target="_blank">${site.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</a></li>`;
                }
            }
            presenceHTML += '</ul>';
            onlinePresenceContainer.innerHTML = presenceHTML;
        }

        // Populate Certifications
        const certContainer = document.getElementById('certificationsContainer');
        if (certContainer && data.certification && Array.isArray(data.certification)) {
            data.certification.forEach(cert => {
                if (cert.name) { // Only display if there's a cert name
                    const certDiv = document.createElement('div');
                    certDiv.className = 'certification-item';
                    let certHTML = `<h4>${cert.name} - ${cert.organization || ''}</h4>`;
                    if (cert['issue-date'] && cert['issue-date'].month && cert['issue-date'].year) {
                        certHTML += `<p>Issued: ${cert['issue-date'].month}/${cert['issue-date'].year}`;
                        if (cert['expiry-date'] && cert['expiry-date'].month && cert['expiry-date'].year) {
                            certHTML += ` | Expires: ${cert['expiry-date'].month}/${cert['expiry-date'].year}`;
                        }
                        certHTML += `</p>`;
                    }
                    if (cert['credential-id']) {
                        certHTML += `<p>Credential ID: ${cert['credential-id']}</p>`;
                    }
                    if (cert['credential-url']) {
                        certHTML += `<p><a href="${cert['credential-url']}" target="_blank">View Credential</a></p>`;
                    }
                    certDiv.innerHTML = certHTML;
                    certContainer.appendChild(certDiv);
                }
            });
        }

    } catch (error) {
        console.error("Error parsing or displaying portfolio data:", error);
        const container = document.querySelector('.portfolio-container');
        if (container) {
            container.innerHTML = `<h1>Error Displaying Portfolio</h1><p>There was an issue processing the portfolio data. ${error.message}</p>`;
        }
    }
});