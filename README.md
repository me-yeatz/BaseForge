<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# BaseForge - No-Code Database Platform

A fully functional no-code database application inspired by Airtable and Baserow, built with React, TypeScript, and powered by Gemini AI.

## ✨ Features

### 📊 Multiple View Types
- **Table View** - Spreadsheet-like grid with inline editing
- **Kanban Board** - Drag-and-drop workflow management
- **Gantt Chart** - Timeline visualization for project planning
- **Dashboard** - Analytics and status distribution

### 🔧 Full CRUD Operations
- ✅ **Create** - Add new records with auto-generated IDs
- ✅ **Read** - View data in multiple formats
- ✅ **Update** - Inline cell editing (click to edit)
- ✅ **Delete** - Remove records with confirmation

### 🎨 Interactive Features
- **Inline Editing** - Click any cell to edit (text, numbers, dates)
- **Dropdown Status** - Quick status changes with visual indicators
- **Drag & Drop** - Move cards between Kanban columns
- **Auto-Save** - Data persists in localStorage
- **Responsive Design** - Works on desktop and mobile

### 🤖 AI Assistant
- Powered by Google Gemini AI
- Context-aware responses about your data
- Help with formulas and database management

## 🚀 Quick Start

**Prerequisites:** Node.js 16+

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up your API key:**
   Create a `.env.local` file and add:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## 📖 Usage Guide

### Adding Records
- Click the **"+ Add Record"** button in Table view
- Or click **"+ ADD_CARD"** in any Kanban column

### Editing Data
- **Text/Number/Date fields**: Click the cell to edit inline
- **Status field**: Use the dropdown to change status
- Press **Enter** or click outside to save

### Deleting Records
- Hover over a row in Table view and click the trash icon
- Or hover over a Kanban card and click the X button

### Switching Views
- Use the sidebar navigation to switch between:
  - Table View
  - Kanban Board
  - Gantt Chart
  - Dashboard

### Using AI Assistant
- Click the floating robot icon in the bottom-right
- Ask questions about your data or get help with formulas
- AI has context about your current table and records

## 🎨 Design Philosophy

BaseForge features an **industrial brutalist design** with:
- Bold typography (Inter font family)
- High contrast black and white base
- Safety Orange (#FF5F1F) accent color
- Blueprint grid backgrounds
- Sharp corners and strong borders
- Micro-animations for enhanced UX

## 🛠️ Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling (via CDN)
- **Google Gemini AI** - AI assistant
- **LocalStorage** - Data persistence

## 📁 Project Structure

```
Baseforge/
├── App.tsx           # Main application component
├── types.ts          # TypeScript interfaces
├── constants.tsx     # Configuration and sample data
├── services/
│   └── geminiService.ts  # AI integration
├── index.tsx         # React entry point
├── index.html        # HTML template
└── vite.config.ts    # Build configuration
```

## 🔒 Data Persistence

- All data is stored in browser's **localStorage**
- Automatically saves on every change
- Data persists across page refreshes
- Clear browser data to reset

## 🌟 Future Enhancements

- [ ] Multiple table support
- [ ] Custom field types (formulas, links, files)
- [ ] Import/Export (CSV, JSON)
- [ ] Collaboration features
- [ ] Backend integration
- [ ] User authentication
- [ ] Advanced filtering and sorting

## 📄 License

MIT License - feel free to use this project for your own purposes!

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

---

Built with ❤️ using React, TypeScript, and Gemini AI
