const form = document.getElementById('tutorialForm');
const urlInput = document.getElementById('tutorialUrl');
const submitBtn = document.getElementById('submitBtn');
const outputContainer = document.getElementById('outputContainer');
const outputDiv = document.getElementById('output');
const errorDiv = document.getElementById('error');
const loadingIndicator = document.getElementById('loadingIndicator');
const resultsSection = document.getElementById('resultsSection');
const fetchedContent = document.getElementById('fetchedContent');
const reviewContent = document.getElementById('reviewContent');

// Fetch and display results on page load
async function loadResults() {
	try {
		const response = await fetch('/api/results');
		if (response.ok) {
			const results = await response.json();
			if (results && (results.fetched || results.review)) {
				resultsSection.style.display = 'block';

				if (results.fetched) {
					fetchedContent.innerHTML = marked.parse(results.fetched);
				}

				if (results.review) {
					reviewContent.innerHTML = marked.parse(results.review);
				}
			}
		}
	} catch (error) {
		console.error('Error loading results:', error);
	}
}

// Load results on page load
loadResults();

form.addEventListener('submit', async (e) => {
	e.preventDefault();

	const tutorialUrl = urlInput.value.trim();
	if (!tutorialUrl) return;

	// Reset UI
	outputDiv.textContent = '';
	errorDiv.style.display = 'none';
	errorDiv.textContent = '';
	outputContainer.classList.add('active');
	submitBtn.disabled = true;
	submitBtn.textContent = 'Processing...';
	loadingIndicator.style.display = 'inline-block';

	try {
		const response = await fetch('/api/tutorial/stream', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ tutorialUrl }),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const reader = response.body.getReader();
		const decoder = new TextDecoder();

		while (true) {
			const { done, value } = await reader.read();

			if (done) {
				loadingIndicator.style.display = 'none';
				submitBtn.disabled = false;
				submitBtn.textContent = 'Check Tutorial';
				// Refresh the page to load new results
				window.location.reload();
				break;
			}

			const chunk = decoder.decode(value, { stream: true });
			outputDiv.textContent += chunk;

			// Auto-scroll to bottom
			outputDiv.scrollTop = outputDiv.scrollHeight;
		}
	} catch (error) {
		console.error('Error:', error);
		errorDiv.textContent = `Error: ${error.message}`;
		errorDiv.style.display = 'block';
		loadingIndicator.style.display = 'none';
		submitBtn.disabled = false;
		submitBtn.textContent = 'Check Tutorial';
	}
});
