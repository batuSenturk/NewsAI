document.addEventListener('DOMContentLoaded', function() {
    const newsForm = document.getElementById('news-form');
    const previousPrompts = document.getElementById('previous-prompts');
    const toggleSidebar = document.getElementById('toggle-sidebar');
    const toggleDarkMode = document.getElementById('toggle-dark-mode');
    const sidebar = document.querySelector('.sidebar');
    const statusDiv = document.getElementById('status');
    const statusMessage = document.getElementById('status-message');
    const resultDiv = document.getElementById('result');
    const socket = io();
    const homePage = document.getElementById('home-page');
    const homeButton = document.getElementById('home-button');

    function showHomePage() {
        homePage.style.display = 'block';
        resultDiv.innerHTML = '';
        hideStatus();
    }

    function hideHomePage() {
        homePage.style.display = 'none';
    }

    showHomePage(); // Show home page on initial load

    homeButton.addEventListener('click', function() {
        showHomePage();
    });

    newsForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const userInput = document.getElementById('user-input').value;
        hideHomePage();
        createNewPage(userInput);
    });

    previousPrompts.addEventListener('click', function(e) {
        if (e.target.tagName === 'A') {
            e.preventDefault();
            hideHomePage();
            fetchPreviousNews(e.target.dataset.filename);
            highlightCurrentChat(e.target);
        }
    });

    toggleSidebar.addEventListener('click', function() {
        sidebar.classList.toggle('active');
    });

    toggleDarkMode.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        const icon = toggleDarkMode.querySelector('i');
        if (document.body.classList.contains('dark-mode')) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    });

    function createNewPage(userInput) {
        hideHomePage();
        showStatus('Starting news aggregation...');
        resultDiv.innerHTML = '';

        fetch('/get_news', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'user_input=' + encodeURIComponent(userInput)
        })
        .then(response => response.json())
        .then(data => {
            hideStatus();
            displayNews(data.result);
            addToPreviousPrompts(data.filename, userInput);
            highlightCurrentChat(document.querySelector(`[data-filename="${data.filename}"]`));
        })
        .catch((error) => {
            console.error('Error:', error);
            showStatus('An error occurred while fetching the news.');
            setTimeout(hideStatus, 3000);  // Hide error message after 3 seconds
        });
    }

    function fetchPreviousNews(filename) {
        hideHomePage();
        showStatus('Retrieving previous news...');
        resultDiv.innerHTML = '';

        fetch('/user_prompts/' + filename)
        .then(response => {
            if (!response.ok) {
                throw new Error('HTTP status ' + response.status);
            }
            return response.text();
        })
        .then(data => {
            hideStatus();
            var lines = data.split('\n');
            var htmlResult = marked.parse(lines.slice(1).join('\n'));
            displayNews(htmlResult);
        })
        .catch((error) => {
            console.error('Error:', error);
            showStatus(`An error occurred while fetching the previous news: ${error.message}`);
            setTimeout(hideStatus, 3000);  // Hide error message after 3 seconds
        });
    }

    function showStatus(message) {
        if (message) {
            statusMessage.textContent = message;
            statusDiv.classList.remove('hidden');
        } else {
            hideStatus();
        }
    }

    function hideStatus() {
        statusDiv.classList.add('hidden');
        statusMessage.textContent = '';
    }

    function displayNews(htmlContent) {
        resultDiv.innerHTML = htmlContent;
        
        // Create main title
        const mainTitle = resultDiv.querySelector('h1');
        if (mainTitle) {
            const mainTitleWrapper = document.createElement('div');
            mainTitleWrapper.className = 'main-title';
            mainTitle.parentNode.insertBefore(mainTitleWrapper, mainTitle);
            mainTitleWrapper.appendChild(mainTitle);
        }

        // Wrap key points
        const keyPoints = Array.from(resultDiv.querySelectorAll('h2')).find(h2 => h2.textContent.includes('Key Points'));
        if (keyPoints) {
            const keyPointsWrapper = document.createElement('div');
            keyPointsWrapper.className = 'key-points';
            keyPoints.parentNode.insertBefore(keyPointsWrapper, keyPoints);
            keyPointsWrapper.appendChild(keyPoints);
            let nextElement = keyPointsWrapper.nextElementSibling;
            while (nextElement && nextElement.tagName !== 'H2') {
                keyPointsWrapper.appendChild(nextElement);
                nextElement = keyPointsWrapper.nextElementSibling;
            }
        }

        // Wrap each article summary
        const summaries = resultDiv.querySelectorAll('h3');
        summaries.forEach((summary, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'article-summary';
            summary.parentNode.insertBefore(wrapper, summary);
            wrapper.appendChild(summary);
            let nextElement = wrapper.nextElementSibling;
            while (nextElement && nextElement.tagName !== 'H3' && nextElement.tagName !== 'H2') {
                wrapper.appendChild(nextElement);
                nextElement = wrapper.nextElementSibling;
            }
            
            // Animate the news item
            wrapper.style.opacity = '0';
            wrapper.style.transform = 'translateY(20px)';
            setTimeout(() => {
                wrapper.style.transition = 'opacity 0.5s, transform 0.5s';
                wrapper.style.opacity = '1';
                wrapper.style.transform = 'translateY(0)';
            }, index * 100);
        });

        // Wrap conclusion
        const conclusion = Array.from(resultDiv.querySelectorAll('h2')).find(h2 => h2.textContent.includes('Conclusion'));
        if (conclusion) {
            const conclusionWrapper = document.createElement('div');
            conclusionWrapper.className = 'conclusion';
            conclusion.parentNode.insertBefore(conclusionWrapper, conclusion);
            conclusionWrapper.appendChild(conclusion);
            let nextElement = conclusionWrapper.nextElementSibling;
            while (nextElement && nextElement.tagName !== 'H2') {
                conclusionWrapper.appendChild(nextElement);
                nextElement = conclusionWrapper.nextElementSibling;
            }
        }

        // Wrap sources
        const sources = Array.from(resultDiv.querySelectorAll('h2')).find(h2 => h2.textContent.includes('Sources'));
        if (sources) {
            const sourcesWrapper = document.createElement('div');
            sourcesWrapper.className = 'sources';
            sources.parentNode.insertBefore(sourcesWrapper, sources);
            sourcesWrapper.appendChild(sources);
            let nextElement = sourcesWrapper.nextElementSibling;
            while (nextElement) {
                sourcesWrapper.appendChild(nextElement);
                nextElement = sourcesWrapper.nextElementSibling;
            }
        }
    }

    function addToPreviousPrompts(filename, prompt) {
        const previousPromptsUl = document.getElementById('previous-prompts');
        const li = document.createElement('li');
        li.className = 'prompt-item';
        
        const a = document.createElement('a');
        a.href = '#';
        a.dataset.filename = filename;
        a.textContent = prompt;
        li.appendChild(a);

        const actionsButton = document.createElement('button');
        actionsButton.className = 'actions-button';
        actionsButton.innerHTML = '<i class="fas fa-ellipsis-v"></i>';
        li.appendChild(actionsButton);

        const actionsMenu = document.createElement('div');
        actionsMenu.className = 'actions-menu hidden';
        
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', (e) => {
            e.stopPropagation();
            editPrompt(li, prompt, filename);
        });
        
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            deletePrompt(li, filename);
        });
        
        actionsMenu.appendChild(editButton);
        actionsMenu.appendChild(deleteButton);
        li.appendChild(actionsMenu);

        previousPromptsUl.insertBefore(li, previousPromptsUl.firstChild);
        
        actionsButton.addEventListener('click', (e) => {
            e.stopPropagation();
            actionsMenu.classList.toggle('hidden');
        });

        // Close the menu when clicking outside
        document.addEventListener('click', () => {
            document.querySelectorAll('.actions-menu').forEach(menu => menu.classList.add('hidden'));
        });

        // Animate the new prompt
        li.style.opacity = '0';
        li.style.transform = 'translateX(-20px)';
        setTimeout(() => {
            li.style.transition = 'opacity 0.5s, transform 0.5s';
            li.style.opacity = '1';
            li.style.transform = 'translateX(0)';
        }, 0);
    }

    function highlightCurrentChat(element) {
        const allLinks = document.querySelectorAll('#previous-prompts a');
        allLinks.forEach(link => link.classList.remove('active'));
        if (element) {
            element.classList.add('active');
        }
    }

    function editPrompt(li, oldPrompt, filename) {
        const form = document.createElement('form');
        form.className = 'edit-prompt-form';
        const input = document.createElement('input');
        input.type = 'text';
        input.value = oldPrompt;
        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.textContent = 'Save';

        form.appendChild(input);
        form.appendChild(submitButton);

        li.innerHTML = '';
        li.appendChild(form);

        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const newPrompt = input.value.trim();
            if (newPrompt && newPrompt !== oldPrompt) {
                updatePrompt(li, newPrompt, filename);
            } else {
                location.reload(); // Reload the page to restore the original state
            }
        });
    }

    function updatePrompt(li, newPrompt, filename) {
        fetch('/update_prompt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filename, newPrompt }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                location.reload(); // Reload the page to show the updated prompt
            } else {
                console.error('Failed to update prompt');
                location.reload(); // Reload the page to restore the original state
            }
        })
        .catch(error => {
            console.error('Error:', error);
            location.reload(); // Reload the page to restore the original state
        });
    }

    function deletePrompt(li, filename) {
        if (confirm('Are you sure you want to delete this search?')) {
            fetch('/delete_prompt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ filename }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    li.remove();
                } else {
                    console.error('Failed to delete prompt');
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
        }
    }

    socket.on('connect', function() {
        console.log('Connected to server');
    });

    socket.on('status', function(data) {
        showStatus(data.message);
    });

    socket.on('complete', function() {
        hideStatus();
    });

    socket.on('disconnect', function() {
        console.log('Disconnected from server');
    });

    // Add event listeners for action buttons
    document.querySelectorAll('.actions-button').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const menu = this.nextElementSibling;
            menu.classList.toggle('hidden');
        });
    });

    // Add event listeners for edit and delete buttons
    document.querySelectorAll('.edit-button').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const li = this.closest('.prompt-item');
            const a = li.querySelector('a');
            editPrompt(li, a.textContent, a.dataset.filename);
        });
    });

    document.querySelectorAll('.delete-button').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const li = this.closest('.prompt-item');
            const a = li.querySelector('a');
            deletePrompt(li, a.dataset.filename);
        });
    });

    // Close all menus when clicking outside
    document.addEventListener('click', function() {
        document.querySelectorAll('.actions-menu').forEach(menu => menu.classList.add('hidden'));
    });
});
