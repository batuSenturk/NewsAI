# NewsAI

**NewsAI** is an intelligent news aggregation platform that leverages AI to deliver relevant and comprehensive news summaries based on user input. Whether you're interested in the latest trends, historical contexts, or specific topics within a designated timeframe, NewsAI provides tailored news updates to keep you informed.

## Table of Contents

- [Features](#features)
- [Demo](#demo)
- [Configuration](#configuration)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Features

- **AI-Powered Summaries:** Receive concise and intelligent summaries of the latest news articles.
- **Wide Range of Topics:** Explore news from various fields and interests tailored to your preferences.
- **Historical Context:** Understand the background and implications of current events with contextual information.
- **Real-Time Updates:** Get the most recent news based on your specified timeframe.
- **User-Friendly Interface:** Easily search for news, view previous searches, and manage your queries.
- **Dark Mode:** Toggle between light and dark themes for a personalized viewing experience.
- **Edit & Delete Prompts:** Manage your previous searches by editing or deleting them as needed.

## Configuration

### Environment Variables

- OPENAI_API_KEY: Your OpenAI API key for accessing GPT-4 models.
- NEWS_API_KEY: Your NewsAPI key for fetching news articles.
- PORT: (Optional) The port number on which the application will run. Default is 5000.

### Model Configuration

The application uses the GPT-4-mini model by default. You can modify the MODEL constant in main.py to use a different OpenAI model if desired.

```bash
MODEL = "gpt-4"  # Example: Change to "gpt-3.5-turbo" if preferred
```

## Usage

1. Search for News
- Enter a topic or query in the search bar located in the sidebar.
- Click the search icon or press Enter to initiate the news aggregation process.

2. View Results
- The application will process your input, fetch relevant news articles, and display summarized updates.
- Summaries emphasize statistics and quantitative data for a comprehensive understanding.

3. Manage Previous Searches
- All your previous searches are listed under "Previous Searches" in the sidebar.
- Click on a prompt to view its results again.
- Use the actions menu (three dots) next to each prompt to edit or delete it.

4. Toggle Dark Mode
- Click the moon icon in the header to switch between light and dark themes.

5. Navigate Home
- Click the "NewsAI" logo in the header to return to the home page.

## Project Structure

```bash
NewsAI/
├── main.py
├── templates/
│   └── index.html
├── static/
│   ├── style.css
│   └── script.js
├── user_prompts/
│   └── *.txt
├── .env
├── requirements.txt
└── README.me
```

- main.py: The main Flask application handling routes, API interactions, and backend logic.
- templates/index.html: The HTML template for the front-end interface.
- static/style.css: CSS styles for the application.
- static/script.js: JavaScript for front-end interactivity.
- user_prompts/: Directory storing user inputs and corresponding news results.
- .env: Environment variables configuration file.
- requirements.txt: Python dependencies.
- README.md: Documentation for the project.

## Technologies Used

## Technologies Used

- **Backend:**
  - [Flask](https://flask.palletsprojects.com/): A lightweight WSGI web application framework.
  - [Flask-SocketIO](https://flask-socketio.readthedocs.io/): Enables real-time bi-directional communication between clients and the server.
  - [OpenAI API](https://beta.openai.com/docs/): For generating AI-powered summaries and recommendations.
  - [NewsAPI](https://newsapi.org/): Fetches news articles based on user queries.

- **Frontend:**
  - HTML5 & CSS3
  - [Font Awesome](https://fontawesome.com/): Icon library.
  - [Inter Font](https://fonts.google.com/specimen/Inter): Modern sans-serif typeface.
  - [Socket.IO](https://socket.io/): Real-time communication.
  - [Marked.js](https://marked.js.org/): Markdown parser and compiler.

- **Other Technologies:**
  - [dotenv](https://github.com/theskumar/python-dotenv): Loads environment variables from a `.env` file.
  - [Scikit-learn](https://scikit-learn.org/): For text processing and similarity calculations.
  - [NumPy](https://numpy.org/): Numerical computing.
  - [Markdown](https://python-markdown.github.io/): Converts Markdown text to HTML.

## Contact

For any questions, suggestions, or feedback, please reach out

*Stay informed with NewsAI – your intelligent companion for the latest news!*
