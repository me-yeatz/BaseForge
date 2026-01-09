<div align="center">
  <img src="https://raw.githubusercontent.com/me-yeatz/Baseforge/main/public/database-icon.png" alt="BaseForge Logo" width="120" height="120">
  <h1>BaseForge</h1>
  <p><strong>Brutalist No-Code Database Platform</strong></p>
  <p>Build powerful databases with Gantt charts, Kanban boards, and AI integration - all with a brutalist aesthetic</p>

  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
  [![PWA](https://img.shields.io/badge/PWA-Supported-ff69b4)](https://web.dev/progressive-web-apps/)

</div>

---

## 🎯 Overview

**BaseForge** is a brutalist-inspired no-code database platform that combines the functionality of Airtable, Baserow, and NocoDB with the visual appeal of brutalist design. Unlike other platforms, BaseForge includes **built-in Gantt chart functionality** - solving the common problem of expensive Gantt chart features in other no-code tools.

Built for architects, project managers, and power users who appreciate raw functionality with minimal aesthetic pretense.

## 🌟 Features

### Core Functionality
- **Table View**: Full-featured spreadsheet-like interface with inline editing
- **Kanban Board**: Drag-and-drop task management with status columns
- **Gantt Chart**: Built-in timeline visualization (the missing feature in most no-code tools!)
- **Dashboard**: Analytics and metrics overview
- **AI Integration**: Natural language commands powered by Gemini, OpenAI, and Hugging Face

### Database Management
- **Multi-table Support**: Create and link multiple tables
- **Field Types**: Text, Number, Date, Status, and more
- **Real-time Editing**: Instant updates across views
- **Import/Export**: Excel, CSV, Markdown import with PDF export
- **External Data Sources**: Connect to PostgreSQL, MongoDB, SQLite

### Brutalist Design
- **Raw Aesthetic**: Unapologetically bold visual design
- **Functional Typography**: Clear hierarchy with brutalist fonts
- **Bold Colors**: Safety orange accents with high contrast
- **Industrial Feel**: Grid-based layouts with strong borders

## 🖼️ Showcase

<!-- Add screenshots here once you upload them to the repository -->
<p align="center">
  <img src="screenshots/dashboard-view.png" width="45%" alt="Dashboard View"/>
  <img src="screenshots/table-view.png" width="45%" alt="Table View"/>
</p>

<p align="center">
  <img src="screenshots/gantt-view.png" width="45%" alt="Gantt Chart View"/>
  <img src="screenshots/kanban-view.png" width="45%" alt="Kanban Board View"/>
</p>

*Dashboard view with analytics | Table view with inline editing*

*Gantt chart with timeline visualization | Kanban board with drag-and-drop*

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/me-yeatz/Baseforge.git
   cd Baseforge
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env.local file with your API keys
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Visit `http://localhost:3000` to see the application

### Environment Variables

Create a `.env.local` file with your API keys:

```env
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key
```

## 🔧 Configuration

### AI Providers
BaseForge supports multiple AI providers:
- **Google Gemini**: For natural language processing
- **OpenAI**: Alternative AI provider
- **Hugging Face**: Open-source model support

Configure your preferred provider in the AI settings panel.

### External Databases
Connect to external databases:
- **PostgreSQL**: Full SQL database support
- **MongoDB**: NoSQL document database
- **SQLite**: Lightweight file-based database

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS + Custom Brutalist CSS
- **State Management**: React Hooks + Local Storage
- **AI Integration**: Google GenAI, OpenAI API, Hugging Face
- **Data Processing**: XLSX, jsPDF, mathjs
- **Icons**: Font Awesome
- **Build Tool**: Vite

## 📊 Architecture

BaseForge follows a modern micro-services-ready monolith architecture:

1. **API Gateway (Express/Fastify)**: Handles HTTP requests, JWT validation, and schema generation.
2. **PostgreSQL + RLS**: The source of truth. Row-Level Security ensures data isolation at the database level.
3. **Redis Pub/Sub**: Handles cross-instance communication for WebSockets. When a row is updated on Server A, Server B receives a Redis message to notify its connected clients.
4. **Formula Worker**: An isolated sandbox for heavy formula computations (can be moved to a separate microservice).
5. **Storage (MinIO/S3)**: Handles file field uploads with signed URLs.

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the brutalist design philosophy
- Maintain high contrast and bold typography
- Keep functionality over aesthetics
- Write clear, concise commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**me-yeatz** - Creator of BaseForge

- GitHub: [@me-yeatz](https://github.com/me-yeatz)

## 🙏 Acknowledgments

- Inspired by the brutalist design movement
- Built for users who prioritize functionality over polish
- Special thanks to the open-source community for the amazing tools used in this project

## ⭐ Support

If you find BaseForge useful, please consider starring the repository! Your support helps us continue improving the platform.

---

<div align="center">

**BaseForge** - *Brutalist Power, No-Cost Gantt Charts*

Made with ❤️ by [me-yeatz](https://github.com/me-yeatz)

[![GitHub stars](https://img.shields.io/github/stars/me-yeatz/Baseforge?style=social)](https://github.com/me-yeatz/Baseforge)

</div>