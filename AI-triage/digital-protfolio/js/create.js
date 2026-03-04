document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('portfolioForm');
    let orgCount = 1;
    let academicCount = 1;
    let languageCount = 1;
    let certificationCount = 1;
    const jobRoleCounters = [1]; // jobRoleCounters[orgIndex] = count of job roles for that org

    // --- Dynamic Element Addition ---

    document.getElementById('addEmploymentBtn').addEventListener('click', () => {
        orgCount++;
        jobRoleCounters.push(1); // Initialize job role counter for the new organization
        const employmentHistorySet = document.getElementById('employmentHistorySet');
        const newEntry = document.createElement('div');
        newEntry.className = 'employment-entry';
        newEntry.innerHTML = `
            <h4>Organization ${orgCount}</h4>
            <label>Organization Name:</label>
            <input type="text" name="emp_org_name[]">
            <label>Duration (e.g., 2021 - Present):</label>
            <input type="text" name="emp_org_duration[]">
            <div class="job-history-section">
                <h5>Job Role 1</h5>
                <label>Designation:</label>
                <input type="text" name="emp_job_designation_${orgCount-1}[]">
                <label>Duration:</label>
                <input type="text" name="emp_job_duration_${orgCount-1}[]">
                <label>Role:</label>
                <input type="text" name="emp_job_role_${orgCount-1}[]">
                <label>Contribution:</label>
                <input type="text" name="emp_job_contribution_${orgCount-1}[]">
                <label>Technologies Used (comma-separated):</label>
                <input type="text" name="emp_job_tech_${orgCount-1}[]">
                <label>Core Responsibilities (one per line):</label>
                <textarea name="emp_job_responsibilities_${orgCount-1}[]" rows="3"></textarea>
            </div>
            <button type="button" class="add-job-btn" data-org-index="${orgCount-1}">Add Another Job Role to this Organization</button>
            <hr>
        `;
        employmentHistorySet.insertBefore(newEntry, document.getElementById('addEmploymentBtn'));
    });

    // Event delegation for adding job roles
    document.getElementById('employmentHistorySet').addEventListener('click', function(event) {
        if (event.target && event.target.classList.contains('add-job-btn')) {
            const orgIndex = parseInt(event.target.dataset.orgIndex);
            jobRoleCounters[orgIndex]++;
            const jobHistorySection = event.target.previousElementSibling; // The div.job-history-section or hr before button
            const parentEntry = event.target.closest('.employment-entry');
            const jobSectionContainer = parentEntry.querySelector('.job-history-section').parentNode; // The div that holds all job roles for this org

            const newJobEntry = document.createElement('div'); // Wrapper for new job role
            newJobEntry.innerHTML = `
                <h5>Job Role ${jobRoleCounters[orgIndex]}</h5>
                <label>Designation:</label>
                <input type="text" name="emp_job_designation_${orgIndex}[]">
                <label>Duration:</label>
                <input type="text" name="emp_job_duration_${orgIndex}[]">
                <label>Role:</label>
                <input type="text" name="emp_job_role_${orgIndex}[]">
                <label>Contribution:</label>
                <input type="text" name="emp_job_contribution_${orgIndex}[]">
                <label>Technologies Used (comma-separated):</label>
                <input type="text" name="emp_job_tech_${orgIndex}[]">
                <label>Core Responsibilities (one per line):</label>
                <textarea name="emp_job_responsibilities_${orgIndex}[]" rows="3"></textarea>
            `;
            // Insert new job role before the "Add Another Job Role" button for that organization
            jobSectionContainer.insertBefore(newJobEntry, event.target);
        }
    });


    document.getElementById('addAcademicBtn').addEventListener('click', () => {
        academicCount++;
        const academicsSet = document.getElementById('academicsSet');
        const newEntry = document.createElement('div');
        newEntry.className = 'academic-entry';
        newEntry.innerHTML = `
            <h4>Academic Qualification ${academicCount}</h4>
            <label>Course/Degree:</label>
            <input type="text" name="acad_course[]">
            <label>Major/Specialization:</label>
            <input type="text" name="acad_major[]">
            <label>Institute:</label>
            <input type="text" name="acad_institute[]">
            <label>Passing Year:</label>
            <input type="number" name="acad_pass_year[]" min="1900" max="2100">
            <hr>
        `;
        academicsSet.insertBefore(newEntry, document.getElementById('addAcademicBtn'));
    });

    document.getElementById('addLanguageBtn').addEventListener('click', () => {
        languageCount++;
        const languagesSet = document.getElementById('languagesSet');
        const newEntry = document.createElement('div');
        newEntry.className = 'language-entry';
        newEntry.innerHTML = `
            <label>Language ${languageCount} (e.g., English Fluent):</label>
            <input type="text" name="lang[]">
        `;
        languagesSet.insertBefore(newEntry, document.getElementById('addLanguageBtn'));
    });

    document.getElementById('addCertificationBtn').addEventListener('click', () => {
        certificationCount++;
        const certificationsSet = document.getElementById('certificationsSet');
        const newEntry = document.createElement('div');
        newEntry.className = 'certification-entry';
        newEntry.innerHTML = `
            <h4>Certification ${certificationCount}</h4>
            <label>Certification Name:</label>
            <input type="text" name="cert_name[]">
            <label>Issuing Organization:</label>
            <input type="text" name="cert_org[]">
            <label>Issue Month (MM):</label>
            <input type="number" name="cert_issue_month[]" min="1" max="12">
            <label>Issue Year (YYYY):</label>
            <input type="number" name="cert_issue_year[]" min="1900" max="2100">
            <label>Expiry Month (MM, optional):</label>
            <input type="number" name="cert_expiry_month[]" min="1" max="12">
            <label>Expiry Year (YYYY, optional):</label>
            <input type="number" name="cert_expiry_year[]" min="1900" max="2100">
            <label>Credential ID:</label>
            <input type="text" name="cert_id[]">
            <label>Credential URL:</label>
            <input type="url" name="cert_url[]">
            <hr>
        `;
        certificationsSet.insertBefore(newEntry, document.getElementById('addCertificationBtn'));
    });

    // --- Form Submission ---
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const data = {};

        // Basic Info
        data.name = formData.get('name');
        data['head-line'] = formData.get('head-line');
        data.address = formData.get('address');
        data.email = formData.get('email');
        data.phone = formData.get('phone');
        data['image-url'] = formData.get('image-url');
        data.objective = formData.get('objective');

        // Experience Summary
        data.experience = {
            'total-exp': formData.get('total-exp'),
            'relevant-exp': formData.get('relevant-exp')
        };

        // Employment History
        data['employment-history'] = [];
        const empOrgNames = formData.getAll('emp_org_name[]');
        empOrgNames.forEach((orgName, i) => {
            if (!orgName.trim()) return; // Skip if organization name is empty
            const orgEntry = {
                organization: orgName,
                duration: formData.getAll('emp_org_duration[]')[i],
                history: []
            };
            const jobDesignations = formData.getAll(`emp_job_designation_${i}[]`);
            jobDesignations.forEach((designation, j) => {
                if (!designation.trim()) return;
                orgEntry.history.push({
                    designation: designation,
                    duration: formData.getAll(`emp_job_duration_${i}[]`)[j],
                    role: formData.getAll(`emp_job_role_${i}[]`)[j],
                    contribution: formData.getAll(`emp_job_contribution_${i}[]`)[j],
                    'technology-used': formData.getAll(`emp_job_tech_${i}[]`)[j],
                    'core-responsibility': formData.getAll(`emp_job_responsibilities_${i}[]`)[j].split('\n').map(s => s.trim()).filter(s => s)
                });
            });
            data['employment-history'].push(orgEntry);
        });

        // Technical Skills
        data['technical-skill'] = {
            'version-control': formData.get('skill_version-control'),
            'container-technology': formData.get('skill_container-technology'),
            'ci/cd': formData.get('skill_ci-cd'),
            'code': formData.get('skill_code'),
            'monitoring': formData.get('skill_monitoring'),
            'iac': formData.get('skill_iac'),
            'cloud': formData.get('skill_cloud')
        };

        // Academics
        data.academics = [];
        formData.getAll('acad_course[]').forEach((course, i) => {
            if (!course.trim()) return;
            data.academics.push({
                course: course,
                major: formData.getAll('acad_major[]')[i],
                institute: formData.getAll('acad_institute[]')[i],
                'pass-year': formData.getAll('acad_pass_year[]')[i]
            });
        });

        // Languages
        data.languages = formData.getAll('lang[]').filter(lang => lang.trim());

        // Online Presence
        data['online-presence'] = {
            github: formData.get('presence_github'),
            linkedin: formData.get('presence_linkedin'),
            'personal-website': formData.get('presence_personal-website')
            // Add others as needed
        };

        // Certifications
        data.certification = [];
        formData.getAll('cert_name[]').forEach((name, i) => {
            if (!name.trim()) return;
            data.certification.push({
                name: name,
                organization: formData.getAll('cert_org[]')[i],
                'issue-date': {
                    month: formData.getAll('cert_issue_month[]')[i],
                    year: formData.getAll('cert_issue_year[]')[i]
                },
                'expiry-date': {
                    month: formData.getAll('cert_expiry_month[]')[i] || "",
                    year: formData.getAll('cert_expiry_year[]')[i] || ""
                },
                'credential-id': formData.getAll('cert_id[]')[i],
                'credential-url': formData.getAll('cert_url[]')[i]
            });
        });

        // Generate and Download JSON
        const jsonString = JSON.stringify(data, null, 4); // Pretty print
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bio-data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert('JSON file generated and download initiated! Please save it to your desired location (e.g., digital-portfolio/data/).');
    });
});