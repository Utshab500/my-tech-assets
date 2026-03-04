document.addEventListener('DOMContentLoaded', () => {
    const jsonFileInput = document.getElementById('jsonFile');
    const viewPortfolioBtn = document.getElementById('viewPortfolioBtn');
    const errorMessageElement = document.getElementById('errorMessage');

    viewPortfolioBtn.addEventListener('click', () => {
        errorMessageElement.textContent = ''; // Clear previous errors
        const file = jsonFileInput.files[0];

        if (!file) {
            errorMessageElement.textContent = 'Please select a JSON file.';
            return;
        }

        if (file.type !== "application/json") {
            errorMessageElement.textContent = 'Please select a valid JSON file (.json).';
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const jsonData = JSON.parse(event.target.result);
                localStorage.setItem('portfolioData', JSON.stringify(jsonData));
                window.location.href = 'portfolio.html'; // Redirect to portfolio page
            } catch (error) {
                errorMessageElement.textContent = 'Error parsing JSON file: ' + error.message;
            }
        };
        reader.readAsText(file);
    });
});