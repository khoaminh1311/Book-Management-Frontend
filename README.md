# BookShelf - Client Web Application

A modern **BookShelf** web interface designed in Figma and built with React 19, Vite, and TailwindCSS, paired with a robust RESTful API built with Node.js, Express, and MongoDB for managing Books and Authors.
Developed with a focus on strict validation, error handling, robust querying capabilities, and seamless user experience.

## Live Deployment Links

🚀 **Production API (Render):** `https://book-management-api-cuds.onrender.com`  
🌐 **Production Web Client (Vercel):** `https://book-management-frontend-taupe.vercel.app/`  

## Features

- **Authors Management**: Full CRUD operations for authors with biography, nationality, and birth year.
- **Books Management**: Full CRUD operations for books with foreign-key references to authors.
- **Advanced Querying & Search**: Search books by title and authors by name (case-insensitive regex) and filter books by genre.
- **Server-Side Sorting**: Dynamic multi-criteria sorting for books (`title`, `price`, `year`, `recent`) and authors (`name`, `year`, `recent`).
- **Cover Artwork Upload**: Multipart/form-data image upload integrated with Cloudinary CDN storage via backend service.
- **Catalog Metrics Aggregation**: Real-time aggregation of total catalog monetary value and volumes count via MongoDB pipelines.
- **Pagination**: Efficient server-side pagination for both books and authors collections.
- **Data Integrity & Security**: Strict validation against invalid types, stored XSS sanitization (DOMPurify), and protocol validation.
- **Relationship Protection**: Prevents deletion of authors that are still referenced by existing books.
- **Centralized Error Handling**: Unified and descriptive error responses with custom Toast notifications and React `ErrorBoundary`.
- **Editorial Web Interface**: 6 cohesive screens matching Figma design system (Dashboard, Book Detail, Add/Edit Book with live preview, Authors List, Author Detail, Add/Edit Author).

## Technology Stack

### Frontend Client
- **Core**: React 19, Vite 6
- **Routing**: React Router 7
- **Styling**: TailwindCSS v3 (Custom Editorial Color Palette & Typography Tokens)
- **Security**: DOMPurify (Stored XSS Sanitization)
- **Icons**: Google Material Symbols

### Connected Backend
- **Runtime**: Node.js (Express.js) & MongoDB Atlas
- **Cloud Storage**: Cloudinary CDN

## Prerequisites

- [Node.js](https://nodejs.org/) (v20 or higher recommended)
- Connected Backend API (Running locally on port 5000 or live on Render)

## Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/khoaminh1311/Book-Management-Frontend.git
   cd Book-Management-Frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory (refer to `.env.example`):
   ```env
   # Connect to live Production Backend on Render:
   VITE_API_URL=https://book-management-api-cuds.onrender.com

   # Or connect to Local Backend (if running backend locally on port 5000):
   # VITE_API_URL=http://localhost:5000
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

5. **Build for Production**
   ```bash
   npm run build
   ```

## Deployment to Vercel

The frontend is optimized for seamless deployment on **Vercel**:

1. Log in to [Vercel](https://vercel.com) and click **Add New...** → **Project**.
2. Select your repository `Book-Management-Frontend`.
3. In **Configure Project**:
   - **Root Directory:** `./` (default root of this repository).
   - **Framework Preset:** Vite (detected automatically).
   - **Build and Output Settings:** Default (`npm run build`, output `dist`).
4. In **Environment Variables**, add:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://book-management-api-cuds.onrender.com`
5. Click **Deploy**. SPA client-side routing is handled automatically via `vercel.json`.
