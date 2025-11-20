A clean and fast anime search, tracking, and discovery app powered by AniList API.

🚀 Features

🔍 Anime Search by title

📘 Detailed Anime Pages with synopsis, episodes, score, and more

⭐ Personal Watchlist / Tracker

📈 Track episodes watched

🗂️ Status options (Watching / Completed / Planned)

🖼️ High-quality images from AniList

⚡ Fast UI, mobile-friendly

🖼️ Screenshots

(Add your images here)
Example format:

Home	Search	Detail

	
	
🛠️ Tech Stack

Frontend: React / HTML / CSS / Tailwind (optional)

Backend: Node.js

API: AniList GraphQL

Database (optional): SQLite / LocalStorage

📦 Installation
1. Clone the repo
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO

2. Install dependencies
npm install

3. Start the development server
npm run dev

🔑 Environment Variables

Create a .env.local file:

VITE_API_URL=http://localhost:3000/api


If using Gemini or AI Studio add:

GEMINI_API_KEY=your_key

📚 API Usage (Quick Example)

Search request:

POST /api/anilist/search { "query": "naruto" }


Response includes:

title

cover image

episodes

score

📌 Roadmap

⏳ Add user accounts

🎨 Better UI themes

📝 Notes per anime

🎬 Seasonal charts

