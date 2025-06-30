// Function to load HTML content dynamically
function loadHTMLContent() {
    // Load header
    fetch('../partials/header.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById("header").innerHTML = data;
        })
        .catch(error => {
            console.error('Error loading header:', error);
        });

    // Load footer
    fetch('../partials/footer.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById("footer").innerHTML = data;
        })
        .catch(error => {
            console.error('Error loading footer:', error);
        });
}

// Call the function to load content
loadHTMLContent();
