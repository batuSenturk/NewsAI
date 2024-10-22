from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from openai import OpenAI
import os
import requests
from dotenv import load_dotenv
from datetime import datetime, timedelta
import markdown
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

load_dotenv()  # Load environment variables from .env file

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
socketio = SocketIO(app, cors_allowed_origins="*")
client = OpenAI()
MODEL = "gpt-4o-mini"  # Define the model as a constant

def clarity_agent(user_input):
    socketio.emit('status', {'message': 'Understanding your input...'})
    print("Clarity Agent: Starting")
    current_date = datetime.now().strftime("%Y-%m-%d")
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": f"You are a clarity agent. Today's date is {current_date}. Understand and clarify what news topics the user wants to know about, including any specified time range. If no time range is specified, assume the last week. Always return your response in the format 'Topics: [topics]\nTime range: [time range]'."},
            {"role": "user", "content": f"Clarify the news topics and time range from this request: {user_input}"}
        ]
    )
    result = response.choices[0].message.content
    print("Clarity Agent: Finished")
    return result

def recommendation_agent(user_interests):
    socketio.emit('status', {'message': 'Generating recommendations...'})
    print("Recommendation Agent: Starting")
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": "You are a recommendation agent. Suggest 3-5 specific news topics based on user interests or current trends."},
            {"role": "user", "content": f"Recommend 3-5 specific news topics based on these interests: {user_interests}"}
        ]
    )
    result = response.choices[0].message.content
    print("Recommendation Agent: Finished")
    return result

def research_agent(topics, time_range):
    socketio.emit('status', {'message': 'Searching for relevant news...'})
    print("Research Agent: Starting")
    api_key = os.getenv('NEWS_API_KEY')
    
    # Calculate the date range
    end_date = datetime.now().date()
    if time_range == "week":
        start_date = end_date - timedelta(days=7)
    elif time_range == "month":
        start_date = end_date - timedelta(days=30)
    else:
        start_date = end_date - timedelta(days=7)  # Default to a week

    # Create a more specific search query
    search_query = ' AND '.join(topics.split())

    url = f"https://newsapi.org/v2/everything?q={search_query}&apiKey={api_key}&pageSize=30&sortBy=relevancy&from={start_date}&to={end_date}"
    response = requests.get(url)
    if response.status_code == 200:
        articles = response.json()['articles']
        if articles:
            # Prepare data for TF-IDF
            titles = [article['title'] for article in articles]
            descriptions = [article['description'] for article in articles]
            contents = [title + " " + desc for title, desc in zip(titles, descriptions)]

            # Calculate TF-IDF scores
            vectorizer = TfidfVectorizer()
            tfidf_matrix = vectorizer.fit_transform(contents)

            # Calculate similarity to the original query
            query_vector = vectorizer.transform([topics])
            similarities = cosine_similarity(query_vector, tfidf_matrix).flatten()

            # Sort articles by similarity score
            sorted_indices = np.argsort(similarities)[::-1]
            top_articles = [articles[i] for i in sorted_indices[:10]]  # Get top 10 most relevant articles

            result = [f"Title: {article['title']}\nDescription: {article['description']}\nURL: {article['url']}\nPublished At: {article['publishedAt']}" for article in top_articles]
        else:
            result = ["No articles found for the given topics and time range."]
    else:
        result = [f"Error fetching articles: {response.status_code}"]
    print("Research Agent: Finished")
    return result

def summary_and_cite_agent(articles):
    socketio.emit('status', {'message': 'Summarizing and citing articles...'})
    print("Summary and Cite Agent: Starting")
    
    # Prepare all articles for a single API call
    articles_text = "\n\n---ARTICLE SEPARATOR---\n\n".join(articles)
    
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": "You are a summary and cite agent. You will receive multiple articles separated by '---ARTICLE SEPARATOR---'. For each article, provide a detailed summary emphasizing statistics, numbers, or quantitative data. Each summary should be at least 200 words long and include proper citation. Clearly separate each article summary."},
            {"role": "user", "content": f"Summarize and cite these news articles, focusing on statistics and quantitative information for each:\n\n{articles_text}"}
        ]
    )
    
    summaries = response.choices[0].message.content.split("---ARTICLE SEPARATOR---")
    print("Summary and Cite Agent: Finished")
    return summaries

def news_agent(user_input):
    socketio.emit('status', {'message': 'Starting news aggregation...'})
    print("News Agent: Starting")
    clarity_result = clarity_agent(user_input)
    
    # Parse clarity_result to extract topics and time range
    try:
        topics, time_range = clarity_result.split('\nTime range: ')
        topics = topics.replace('Topics: ', '').strip()
        time_range = time_range.strip()
    except ValueError:
        print("Clarity Agent response not in expected format. Using default values.")
        topics = user_input
        time_range = "week"
    
    if not topics or "not specified" in topics.lower():
        recommendations = recommendation_agent(user_input)
        topics = recommendations
    
    articles = research_agent(topics, time_range)
    summaries = summary_and_cite_agent(articles)
    
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": """You are a news agent. Combine the results from other agents into a coherent and detailed response, emphasizing statistics and quantitative data. 
            Format your response as follows:
            
            # News Update: [Main Topic]
            
            ## Key Points
            1. [First key point]
            2. [Second key point]
            3. [Third key point]
            ...
            
            ## Detailed Summaries
            
            ### [Title of Article 1]
            [Detailed summary of Article 1]
            
            ### [Title of Article 2]
            [Detailed summary of Article 2]
            
            ...
            
            ## Conclusion
            [Provide a brief conclusion or overall insight]
            
            ## Sources
            1. [Source 1 with link to article]
            2. [Source 2 with link to article]
            ...
            
            Ensure all summaries are comprehensive and include relevant statistics and data."""},
            {"role": "user", "content": f"Combine these results into a comprehensive news update:\nTopics: {topics}\nTime Range: {time_range}\nArticles and Summaries: {', '.join([f'Article {i+1}: {article}\nSummary: {summary}' for i, (article, summary) in enumerate(zip(articles, summaries))])}"}
        ]
    )
    result = response.choices[0].message.content
    print("News Agent: Finished")
    socketio.emit('complete')
    return result

@app.route('/')
def index():
    prompts = get_previous_prompts()
    return render_template('index.html', prompts=prompts)

@app.route('/get_news', methods=['POST'])
def get_news():
    user_input = request.form['user_input']
    result = news_agent(user_input)
    
    # Extract the main topic from user input (simple approach)
    main_topic = re.sub(r'[^\w\s-]', '', user_input.split()[0].lower())
    
    # Create a valid filename
    filename = get_unique_filename(f"{main_topic}_news.txt")
    
    # Write the result to the file
    with open(os.path.join('user_prompts', filename), 'w', encoding='utf-8') as file:
        file.write(user_input + "\n\n" + result)
    
    # Convert markdown to HTML
    html_result = markdown.markdown(result)
    
    socketio.emit('complete')
    return jsonify({'result': html_result, 'filename': filename})

@app.route('/user_prompts/<path:filename>')
def serve_file(filename):
    try:
        return send_from_directory('user_prompts', filename)
    except FileNotFoundError:
        return jsonify({'error': 'File not found'}), 404

def get_previous_prompts():
    prompts = []
    for filename in os.listdir('user_prompts'):
        if filename.endswith('.txt'):
            file_path = os.path.join('user_prompts', filename)
            creation_time = os.path.getctime(file_path)
            with open(file_path, 'r', encoding='utf-8') as file:
                prompt = file.readline().strip()
                prompts.append({'filename': filename, 'prompt': prompt, 'creation_time': creation_time})
    
    # Sort prompts by creation time, most recent first
    prompts.sort(key=lambda x: x['creation_time'], reverse=True)
    return prompts

def get_unique_filename(filename):
    base, ext = os.path.splitext(filename)
    counter = 1
    while os.path.exists(os.path.join('user_prompts', filename)):
        filename = f"{base}_{counter}{ext}"
        counter += 1
    return filename

@app.route('/update_prompt', methods=['POST'])
def update_prompt():
    data = request.json
    filename = data['filename']
    new_prompt = data['newPrompt']
    
    file_path = os.path.join('user_prompts', filename)
    if os.path.exists(file_path):
        with open(file_path, 'r+', encoding='utf-8') as file:
            content = file.read()
            file.seek(0)
            file.write(new_prompt + '\n\n' + '\n'.join(content.split('\n')[2:]))
            file.truncate()
        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'error': 'File not found'}), 404

@app.route('/delete_prompt', methods=['POST'])
def delete_prompt():
    data = request.json
    filename = data['filename']
    
    file_path = os.path.join('user_prompts', filename)
    if os.path.exists(file_path):
        os.remove(file_path)
        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'error': 'File not found'}), 404

if __name__ == '__main__':
    os.makedirs('user_prompts', exist_ok=True)
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port, debug=False)
