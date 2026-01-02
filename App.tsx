import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  API_ENDPOINTS,
  PRISMA_SCHEMA,
  SERVER_SETUP_CODE,
  FORMULA_ENGINE_CODE,
  ARCHITECTURE_DESCRIPTION
} from './constants';
import { SpecSection, ChatMessage, Table, Row, Field, ViewDefinition, DataSource, DbType } from './types';
import { askAi, DEFAULT_AI_CONFIG, AiConfig } from './services/aiService';
import { parseExcel, parseMarkdown, exportToPDF } from './utils/importExport';

// Initial Sample Data
const INITIAL_FIELDS: Field[] = [
  { id: 'f1', name: 'Task Name', type: 'TEXT' },
  { id: 'f2', name: 'Status', type: 'STATUS', options: ['BACKLOG', 'IN_PROGRESS', 'REVIEW', 'DONE'] },
  { id: 'f3', name: 'Start Date', type: 'DATE' },
  { id: 'f4', name: 'End Date', type: 'DATE' },
  { id: 'f5', name: 'Priority', type: 'NUMBER' },
];

const INITIAL_ROWS: Row[] = [
  { id: 'r1', f1: 'Initialize API Gateway', f2: 'DONE', f3: '2024-01-01', f4: '2024-01-05', f5: 1 },
  { id: 'r2', f1: 'Setup PostgreSQL RLS', f2: 'IN_PROGRESS', f3: '2024-01-06', f4: '2024-01-12', f5: 1 },
  { id: 'r3', f1: 'Formula Engine Stress Test', f2: 'REVIEW', f3: '2024-01-10', f4: '2024-01-15', f5: 2 },
  { id: 'r4', f1: 'Websocket Load Balancing', f2: 'BACKLOG', f3: '2024-01-15', f4: '2024-01-25', f5: 3 },
  { id: 'r5', f1: 'Security Audit v1', f2: 'BACKLOG', f3: '2024-01-20', f4: '2024-02-01', f5: 1 },
];

const VIEW_SECTIONS: SpecSection[] = [
  { id: 'table', title: 'TABLE_VIEW', icon: 'fa-table', category: 'APP' },
  { id: 'kanban', title: 'KANBAN_BOARD', icon: 'fa-columns', category: 'APP' },
  { id: 'gantt', title: 'GANTT_CHART', icon: 'fa-chart-bar', category: 'APP' },
  { id: 'dashboard', title: 'DASHBOARD', icon: 'fa-chart-line', category: 'APP' },
  { id: 'data_sources', title: 'EXTERNAL_LINKS', icon: 'fa-link', category: 'SYSTEM' },
  { id: 'ai_manager', title: 'AI_MANAGER', icon: 'fa-brain', category: 'SYSTEM' },
];

const SectionFrame: React.FC<{ children: React.ReactNode, title: string, subtitle: string }> = ({ children, title, subtitle }) => (
  <div className="relative pt-12 pb-8 px-4 sm:px-8 animate-reveal">
    <div className="flex flex-col items-center justify-center mb-12 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 flex justify-center space-x-24 text-[10px] font-black text-black opacity-40">
        <span>UNIT: AD-47</span>
        <span className="bg-[#FF5F1F] text-black px-4 py-1 opacity-100">BASEFORGE CORE ENGINE</span>
        <span>AUTH: LVL-4</span>
      </div>

      <div className="relative py-8 px-16 border-x border-black/10">
        <div className="corner-bracket bracket-tl"></div>
        <div className="corner-bracket bracket-tr"></div>
        <div className="corner-bracket bracket-bl"></div>
        <div className="corner-bracket bracket-br"></div>

        <h1 className="text-4xl md:text-6xl font-black text-center leading-none tracking-tighter uppercase whitespace-nowrap">
          {title}
        </h1>
        <p className="text-center font-black mt-2 tracking-[0.4em] uppercase text-gray-400 text-xs">
          {subtitle}
        </p>
      </div>
    </div>

    <div className="w-full">
      {children}
    </div>
  </div>
);

const App: React.FC = () => {
  const [activeView, setActiveView] = useState('table');
  const [tables, setTables] = useState<Table[]>([{
    id: 't1',
    name: 'Project Roadmap',
    fields: INITIAL_FIELDS,
    rows: INITIAL_ROWS,
  }]);
  const [activeTableId, setActiveTableId] = useState('t1');

  const activeTable = tables.find(t => t.id === activeTableId) || tables[0];

  const [editingCell, setEditingCell] = useState<{ rowId: string; fieldId: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [draggedCard, setDraggedCard] = useState<string | null>(null);

  // Modal States
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [newFieldData, setNewFieldData] = useState<Partial<Field>>({ name: '', type: 'TEXT' });
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Settings
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [aiConfig, setAiConfig] = useState<AiConfig>(DEFAULT_AI_CONFIG);

  // Data Sources
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [isDataSourceModalOpen, setIsDataSourceModalOpen] = useState(false);
  const [newDataSource, setNewDataSource] = useState<Partial<DataSource>>({ name: '', type: 'POSTGRES', connectionString: '' });

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Welcome to BaseForge! I'm your AI assistant. I can help you manage your data, create formulas, or answer questions about your database.", timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [aiLogs, setAiLogs] = useState<string[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('baseforge_data');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setTables(data.tables || tables);
        setActiveTableId(data.activeTableId || activeTableId);
        if (data.aiConfig) setAiConfig(data.aiConfig);
        if (data.dataSources) setDataSources(data.dataSources);
      } catch (e) {
        console.error('Failed to load data:', e);
      }
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('baseforge_data', JSON.stringify({ tables, activeTableId, aiConfig, dataSources }));
  }, [tables, activeTableId, aiConfig, dataSources]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const executeAiAction = (response: string) => {
    try {
      // Find JSON block
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/{[\s\S]*}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        const action = JSON.parse(jsonStr);

        setAiLogs(prev => [`[${new Date().toLocaleTimeString()}] AI Action: ${action.action}`, ...prev]);

        if (action.action === 'CREATE_TABLE') {
          const newTable: Table = {
            id: `t${Date.now()}`,
            name: action.name || 'AI Generated Table',
            fields: action.fields?.map((f: any, i: number) => ({ ...f, id: `f${i}` })) || [],
            rows: []
          };
          setTables(prev => [...prev, newTable]);
          setActiveTableId(newTable.id);
        } else if (action.action === 'ADD_FIELD') {
          const field: Field = {
            id: `f${Date.now()}`,
            name: action.name,
            type: action.type || 'TEXT',
            options: action.options
          };
          setTables(prev => prev.map(t => t.id === activeTableId ? { ...t, fields: [...t.fields, field] } : t));
        } else if (action.action === 'SWITCH_VIEW') {
          setActiveView(action.viewId);
        }
      }
    } catch (e) {
      console.error("AI Action Exec Failed", e);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    const context = `Active Table: ${activeTable.name}, Views: ${VIEW_SECTIONS.map(v => v.id).join(',')}, Fields: ${activeTable.fields.map(f => f.name).join(', ')}`;

    try {
      const response = await askAi(input, context, aiConfig);
      executeAiAction(response); // Check for actions
      setIsTyping(false);
      setMessages(prev => [...prev, { role: 'assistant', content: response, timestamp: Date.now() }]);
    } catch (e) {
      setIsTyping(false);
      setMessages(prev => [...prev, { role: 'assistant', content: "Error communicating with AI. Check Settings.", timestamp: Date.now() }]);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let table: Table | null = null;
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.csv')) {
      table = await parseExcel(file);
    } else if (file.name.endsWith('.md')) {
      table = await parseMarkdown(file);
    }

    if (table) {
      setTables(prev => [...prev, table!]);
      setActiveTableId(table.id);
      setIsTableModalOpen(false);
    }
  };

  const exportData = () => {
    exportToPDF(activeTable);
  };

  // Field & Table Operations
  const addTable = () => {
    if (!newTableName.trim()) return;
    const newTable: Table = {
      id: `t${Date.now()}`,
      name: newTableName,
      fields: [
        { id: 'f1', name: 'Name', type: 'TEXT' },
        { id: 'f2', name: 'Status', type: 'STATUS', options: ['Todo', 'In Progress', 'Done'] }
      ],
      rows: []
    };
    setTables(prev => [...prev, newTable]);
    setActiveTableId(newTable.id);
    setNewTableName('');
    setIsTableModalOpen(false);
  };

  const addField = () => {
    if (!newFieldData.name?.trim()) return;
    const newField: Field = {
      id: `f${Date.now()}`,
      name: newFieldData.name,
      type: newFieldData.type || 'TEXT',
      options: newFieldData.type === 'STATUS' ? ['Option 1', 'Option 2', 'Option 3'] : undefined
    };

    setTables(prev => prev.map(table =>
      table.id === activeTableId
        ? { ...table, fields: [...table.fields, newField] }
        : table
    ));

    setNewFieldData({ name: '', type: 'TEXT' });
    setIsFieldModalOpen(false);
  };

  const deleteField = (fieldId: string) => {
    if (confirm('Delete this field? Data in this column will be lost.')) {
      setTables(prev => prev.map(table =>
        table.id === activeTableId
          ? { ...table, fields: table.fields.filter(f => f.id !== fieldId) }
          : table
      ));
    }
  };

  const addDataSource = () => {
    if (!newDataSource.name || !newDataSource.connectionString) return;
    const source: DataSource = {
      id: `ds_${Date.now()}`,
      name: newDataSource.name!,
      type: newDataSource.type as DbType || 'POSTGRES',
      connectionString: newDataSource.connectionString!,
      status: 'CONNECTED',
      lastSync: Date.now()
    };
    setDataSources(prev => [...prev, source]);
    setNewDataSource({ name: '', type: 'POSTGRES', connectionString: '' });
    setIsDataSourceModalOpen(false);
  };

  // Modal Component
  const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center backdrop-blur-sm">
        <div className="bg-white border-4 border-black p-8 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] max-w-md w-full animate-reveal">
          <div className="flex justify-between items-center mb-6 border-b-2 border-black pb-2">
            <h3 className="text-xl font-black uppercase italic">{title}</h3>
            <button onClick={onClose} className="text-black hover:text-[#FF5F1F] transition-colors">
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
          {children}
        </div>
      </div>
    );
  };

  // CRUD Operations
  const updateCell = (rowId: string, fieldId: string, value: any) => {
    setTables(prev => prev.map(table =>
      table.id === activeTableId
        ? {
          ...table,
          rows: table.rows.map(row =>
            row.id === rowId ? { ...row, [fieldId]: value } : row
          )
        }
        : table
    ));
  };

  const addRow = () => {
    const newRow: Row = {
      id: `r${Date.now()}`,
      ...activeTable.fields.reduce((acc, field) => {
        acc[field.id] = field.type === 'NUMBER' ? 0 : field.type === 'DATE' ? new Date().toISOString().split('T')[0] : field.type === 'STATUS' ? (field.options?.[0] || '') : '';
        return acc;
      }, {} as any)
    };

    setTables(prev => prev.map(table =>
      table.id === activeTableId
        ? { ...table, rows: [...table.rows, newRow] }
        : table
    ));
  };

  const deleteRow = (rowId: string) => {
    if (confirm('Delete this record?')) {
      setTables(prev => prev.map(table =>
        table.id === activeTableId
          ? { ...table, rows: table.rows.filter(r => r.id !== rowId) }
          : table
      ));
    }
  };

  const startEdit = (rowId: string, fieldId: string, currentValue: any) => {
    setEditingCell({ rowId, fieldId });
    setEditValue(currentValue?.toString() || '');
  };

  const saveEdit = () => {
    if (editingCell) {
      const field = activeTable.fields.find(f => f.id === editingCell.fieldId);
      let value: any = editValue;

      if (field?.type === 'NUMBER') {
        value = parseFloat(editValue) || 0;
      }

      updateCell(editingCell.rowId, editingCell.fieldId, value);
      setEditingCell(null);
      setEditValue('');
    }
  };

  const handleDragStart = (rowId: string) => {
    setDraggedCard(rowId);
  };

  const handleDrop = (newStatus: string) => {
    if (draggedCard) {
      const statusField = activeTable.fields.find(f => f.type === 'STATUS');
      if (statusField) {
        updateCell(draggedCard, statusField.id, newStatus);
      }
      setDraggedCard(null);
    }
  };

  // View Components
  const TableView = () => (
    <div className="bg-white border-2 border-black overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <div className="bg-black text-white p-4 flex justify-between items-center">
        <h2 className="text-lg font-black uppercase italic">{activeTable.name}</h2>
        <div className="flex gap-4">
          <button
            onClick={exportData}
            className="text-xs font-black uppercase hover:text-[#FF5F1F] transition-colors flex items-center gap-2"
          >
            <i className="fas fa-file-export"></i> Export PDF
          </button>
          <button
            onClick={() => setIsFieldModalOpen(true)}
            className="text-xs font-black uppercase hover:text-[#FF5F1F] transition-colors flex items-center gap-2"
          >
            <i className="fas fa-plus"></i> Add Field
          </button>
          <button
            onClick={addRow}
            className="bg-[#FF5F1F] text-black px-4 py-2 text-xs font-black uppercase hover:bg-white transition-all border-2 border-white"
          >
            + Add Record
          </button>
        </div>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-black">
              <th className="p-4 text-xs font-black uppercase border-r border-gray-300 w-12">#</th>
              {activeTable.fields.map(f => (
                <th key={f.id} className="p-4 text-xs font-black uppercase tracking-widest border-r border-gray-300 min-w-[200px] group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <i className={`fas ${f.type === 'STATUS' ? 'fa-tag' :
                        f.type === 'DATE' ? 'fa-calendar' :
                          f.type === 'NUMBER' ? 'fa-hashtag' :
                            'fa-font'
                        } text-[#FF5F1F]`}></i>
                      {f.name}
                    </div>
                    <button onClick={() => deleteField(f.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600">
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                </th>
              ))}
              <th className="p-4 text-xs font-black uppercase w-24 border-dashed border-2 border-gray-300/50 hover:bg-gray-50 cursor-pointer text-center text-gray-400 hover:text-black" onClick={() => setIsFieldModalOpen(true)}>
                <i className="fas fa-plus"></i>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {activeTable.rows.map((row, i) => (
              <tr key={row.id} className="hover:bg-gray-50 transition-colors group">
                <td className="p-4 text-xs font-mono font-bold text-gray-400 bg-gray-50 border-r border-gray-200">{i + 1}</td>
                {activeTable.fields.map(f => (
                  <td
                    key={f.id}
                    className="p-4 text-sm font-bold border-r border-gray-200 cursor-pointer hover:bg-blue-50"
                    onClick={() => f.type !== 'STATUS' && startEdit(row.id, f.id, row[f.id])}
                  >
                    {editingCell?.rowId === row.id && editingCell?.fieldId === f.id ? (
                      <input
                        type={f.type === 'NUMBER' ? 'number' : f.type === 'DATE' ? 'date' : 'text'}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                        autoFocus
                        className="w-full px-2 py-1 border-2 border-[#FF5F1F] focus:outline-none font-bold"
                      />
                    ) : f.type === 'STATUS' ? (
                      <select
                        value={row[f.id] || ''}
                        onChange={(e) => updateCell(row.id, f.id, e.target.value)}
                        className={`px-3 py-1 text-[10px] font-black border-2 border-black cursor-pointer ${row[f.id] === 'DONE' ? 'bg-green-100' :
                          row[f.id] === 'IN_PROGRESS' ? 'bg-[#FF5F1F] text-white' :
                            row[f.id] === 'REVIEW' ? 'bg-blue-100' : 'bg-gray-100'
                          }`}
                      >
                        {f.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="block truncate">{row[f.id]}</span>
                    )}
                  </td>
                ))}
                <td className="p-4">
                  <button
                    onClick={() => deleteRow(row.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800 transition-all"
                    title="Delete row"
                  >
                    <i className="fas fa-trash text-sm"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const KanbanView = () => {
    const statusField = activeTable.fields.find(f => f.type === 'STATUS');
    const statuses = statusField?.options || [];

    return (
      <div className="flex gap-8 overflow-x-auto pb-8 custom-scrollbar">
        {statuses.map(status => (
          <div
            key={status}
            className="flex-shrink-0 w-80"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(status)}
          >
            <div className="bg-black text-[#FF5F1F] p-4 flex justify-between items-center mb-6">
              <h3 className="font-black italic text-sm">{status}</h3>
              <span className="text-xs font-mono">{activeTable.rows.filter(r => r[statusField!.id] === status).length}</span>
            </div>
            <div className="space-y-4">
              {activeTable.rows.filter(r => r[statusField!.id] === status).map(row => (
                <div
                  key={row.id}
                  draggable
                  onDragStart={() => handleDragStart(row.id)}
                  className="bg-white border-2 border-black p-6 relative group hover:-translate-y-1 transition-transform cursor-move"
                >
                  <div className="corner-bracket bracket-tl w-2 h-2 border-2"></div>
                  <div className="corner-bracket bracket-tr w-2 h-2 border-2"></div>
                  <div className="font-black text-sm uppercase mb-4 leading-tight">{row[activeTable.fields[0].id]}</div>
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-mono opacity-40">ID: {row.id}</span>
                    {activeTable.fields.find(f => f.type === 'NUMBER') && (
                      <span className="text-xs font-black">PRIORITY: {row[activeTable.fields.find(f => f.type === 'NUMBER')!.id]}</span>
                    )}
                  </div>
                  <button
                    onClick={() => deleteRow(row.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800 transition-all"
                  >
                    <i className="fas fa-times text-xs"></i>
                  </button>
                </div>
              ))}
              <button
                onClick={addRow}
                className="w-full border-2 border-dashed border-black/20 p-4 text-center text-[10px] font-black uppercase text-gray-300 hover:border-black hover:text-black cursor-pointer transition-all"
              >
                + ADD_CARD
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const GanttView = () => {
    const dateFields = activeTable.fields.filter(f => f.type === 'DATE');
    const startDateField = dateFields[0];
    const endDateField = dateFields[1];

    if (!startDateField || !endDateField) {
      return (
        <div className="bg-white border-2 border-black p-12 text-center">
          <p className="text-lg font-black uppercase text-gray-400">Gantt view requires at least 2 DATE fields (Start & End)</p>
        </div>
      );
    }

    return (
      <div className="bg-white border-2 border-black overflow-hidden flex flex-col h-[600px]">
        <div className="bg-black text-white p-4 flex justify-between text-[10px] font-black uppercase tracking-widest">
          <span>Timeline_Schedule</span>
          <span>{activeTable.name}</span>
        </div>
        <div className="flex-1 flex overflow-hidden">
          <div className="w-64 border-r-2 border-black bg-gray-50 shrink-0 overflow-y-auto">
            {activeTable.rows.map(r => (
              <div key={r.id} className="h-12 border-b border-black/5 p-3 text-xs font-black uppercase truncate">
                {r[activeTable.fields[0].id]}
              </div>
            ))}
          </div>
          <div className="flex-1 overflow-auto blueprint-grid relative">
            {activeTable.rows.map((r, i) => {
              const startDate = new Date(r[startDateField.id]);
              const endDate = new Date(r[endDateField.id]);
              const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
              const startDay = startDate.getDate();

              const left = (startDay - 1) * 32;
              const width = Math.max(daysDiff * 32, 32);

              return (
                <div key={r.id} className="h-12 border-b border-black/5 relative group">
                  <div
                    className="absolute top-2 h-8 bg-[#FF5F1F] border-2 border-black flex items-center px-2 text-[9px] font-black text-black overflow-hidden whitespace-nowrap cursor-pointer hover:z-10 hover:shadow-lg"
                    style={{ left: `${left}px`, width: `${width}px` }}
                    title={`${r[activeTable.fields[0].id]}: ${r[startDateField.id]} to ${r[endDateField.id]}`}
                  >
                    {r[activeTable.fields[0].id]}
                  </div>
                </div>
              );
            })}
            {/* Vertical Grid Lines */}
            <div className="absolute inset-0 pointer-events-none flex">
              {Array.from({ length: 31 }).map((_, i) => (
                <div key={i} className="w-8 border-r border-black/5 h-full flex items-end p-1 text-[8px] font-mono text-gray-300">
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const DashboardView = () => {
    const statusField = activeTable.fields.find(f => f.type === 'STATUS');
    const completedCount = statusField ? activeTable.rows.filter(r => r[statusField.id] === 'DONE').length : 0;
    const completionRate = activeTable.rows.length > 0 ? Math.round((completedCount / activeTable.rows.length) * 100) : 0;

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'TOTAL_RECORDS', val: activeTable.rows.length, color: 'text-black' },
            { label: 'COMPLETION_RATE', val: `${completionRate}%`, color: 'text-green-600' },
            { label: 'FIELDS_COUNT', val: activeTable.fields.length.toString().padStart(2, '0'), color: 'text-[#FF5F1F]' },
            { label: 'LAST_UPDATED', val: 'NOW', color: 'text-blue-600' },
          ].map((stat, i) => (
            <div key={i} className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <p className="label-text mb-2 opacity-40">{stat.label}</p>
              <p className={`text-4xl font-black italic ${stat.color}`}>{stat.val}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border-2 border-black p-8">
            <h3 className="text-xl font-black uppercase mb-6 italic">Status Distribution</h3>
            <div className="space-y-4">
              {statusField?.options?.map(status => {
                const count = activeTable.rows.filter(r => r[statusField.id] === status).length;
                const percentage = activeTable.rows.length > 0 ? (count / activeTable.rows.length) * 100 : 0;
                return (
                  <div key={status}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-black uppercase">{status}</span>
                      <span className="text-sm font-bold">{count} ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="h-4 bg-gray-200 border-2 border-black">
                      <div
                        className={`h-full ${status === 'DONE' ? 'bg-green-500' :
                          status === 'IN_PROGRESS' ? 'bg-[#FF5F1F]' :
                            status === 'REVIEW' ? 'bg-blue-500' :
                              'bg-gray-400'
                          }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-[#FF5F1F] p-8 border-4 border-black">
            <h3 className="text-xl font-black uppercase mb-4 italic">Recent Activity</h3>
            <div className="space-y-4 font-black text-xs uppercase">
              <div className="border-b border-black pb-2 opacity-60">Database: {activeTable.name}</div>
              <div className="border-b border-black pb-2 opacity-80">Total Records: {activeTable.rows.length}</div>
              <div className="border-b border-black pb-2">Fields: {activeTable.fields.length}</div>
              <div className="border-b border-black pb-2 animate-pulse">Status: ACTIVE</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const AiManagerView = () => (
    <div className="bg-black text-[#FF5F1F] p-8 border-4 border-black font-mono shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] h-[600px] flex flex-col">
      <div className="border-b-2 border-[#FF5F1F] pb-4 mb-4 flex justify-between items-center">
        <h3 className="text-xl font-black uppercase">&gt;&gt; AI_COMMAND_CENTER</h3>
        <div className="flex gap-4 text-xs font-bold bg-[#FF5F1F] text-black px-2 py-1">
          <span>STATUS: ONLINE</span>
          <span>MODE: AGENTIC</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2 border border-[#FF5F1F]/20 bg-black/50 mb-4">
        {aiLogs.length === 0 && <div className="opacity-50">Waiting for commands... Ask the Assistant to "create a table" or "add a field".</div>}
        {aiLogs.map((log, i) => (
          <div key={i} className="text-sm border-l-2 border-[#FF5F1F] pl-2">{log}</div>
        ))}
      </div>
      <div className="text-xs opacity-50">
        * The AI Architect can execute commands to modify the database structure directly.
      </div>
    </div>
  );

  const DataSourcesView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div>
          <h3 className="text-xl font-black uppercase">Linked Databases</h3>
          <p className="text-xs font-bold opacity-50 mt-1">CONNECT EXTERNAL DATA SOURCES</p>
        </div>
        <button onClick={() => setIsDataSourceModalOpen(true)} className="bg-[#FF5F1F] text-black px-4 py-2 text-xs font-black uppercase hover:bg-black hover:text-[#FF5F1F] transition-all border-2 border-black">
          + Link Database
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dataSources.map(ds => (
          <div key={ds.id} className="bg-white border-2 border-black p-6 relative group hover:-translate-y-1 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-black text-white text-[10px] font-black px-2 py-1 uppercase">{ds.type}</div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${ds.status === 'CONNECTED' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-[10px] font-bold opacity-50">{ds.status}</span>
              </div>
            </div>
            <h4 className="text-lg font-black uppercase mb-2 truncate" title={ds.name}>{ds.name}</h4>
            <div className="text-[10px] font-mono bg-gray-100 p-2 border border-gray-200 truncate mb-4">
              {ds.connectionString}
            </div>
            <div className="flex gap-2 text-[10px] font-black uppercase">
              <button className="flex-1 py-2 border-2 border-black hover:bg-black hover:text-white transition-all">Test Link</button>
              <button onClick={() => setDataSources(prev => prev.filter(d => d.id !== ds.id))} className="flex-1 py-2 border-2 border-black bg-gray-100 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all">Unlink</button>
            </div>
          </div>
        ))}
        {dataSources.length === 0 && (
          <div className="col-span-full text-center p-12 opacity-30 font-black uppercase border-2 border-dashed border-black">
            No external databases linked.
          </div>
        )}
      </div>
    </div>
  );

  const renderActiveView = () => {
    switch (activeView) {
      case 'table': return <SectionFrame title="TABLE_VIEW" subtitle="DATA_GRID"><TableView /></SectionFrame>;
      case 'kanban': return <SectionFrame title="KANBAN_BOARD" subtitle="WORKFLOW_MANAGEMENT"><KanbanView /></SectionFrame>;
      case 'gantt': return <SectionFrame title="GANTT_CHART" subtitle="TIMELINE_VISUALIZATION"><GanttView /></SectionFrame>;
      case 'dashboard': return <SectionFrame title="DASHBOARD" subtitle="ANALYTICS_OVERVIEW"><DashboardView /></SectionFrame>;
      case 'data_sources': return <SectionFrame title="EXTERNAL_LINKS" subtitle="DATA_CONNECTORS"><DataSourcesView /></SectionFrame>;
      case 'ai_manager': return <SectionFrame title="AI_MANAGER" subtitle="SYSTEM_LOGS"><AiManagerView /></SectionFrame>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex text-black overflow-hidden relative selection:bg-[#FF5F1F] selection:text-white">
      {/* HUD Overlay Elements */}
      <div className="fixed top-6 left-6 label-text opacity-30 select-none z-0">BASEFORGE v2.0</div>
      <div className="fixed top-6 right-6 label-text opacity-30 select-none z-0">NO-CODE DATABASE</div>
      <div className="fixed bottom-6 left-6 label-text opacity-30 select-none z-0">RECORDS: {activeTable.rows.length}</div>
      <div className="fixed bottom-6 right-6 label-text opacity-30 select-none z-0">ACTIVE_TABLE</div>

      {/* Sidebar Navigation */}
      <aside className="w-20 lg:w-72 bg-white border-r-4 border-black flex flex-col z-20 relative">
        <div className="p-4 lg:p-8 border-b-4 border-black bg-[#FF5F1F]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-black rounded-none flex items-center justify-center text-[#FF5F1F] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
              <i className="fas fa-database text-xl"></i>
            </div>
            <div className="hidden lg:block">
              <span className="text-2xl font-black uppercase tracking-tighter italic leading-none block">BaseForge</span>
              <span className="text-[9px] font-bold opacity-60 block uppercase mt-1">No-Code Database</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 lg:px-8 lg:py-6 flex justify-between items-center text-[10px] font-black opacity-30 uppercase tracking-[0.3em] hidden lg:flex">
            <span>Tables</span>
            <button onClick={() => setIsTableModalOpen(true)} className="hover:text-black hover:opacity-100 transition-all"><i className="fas fa-plus"></i></button>
          </div>

          {tables.map(table => (
            <button
              key={table.id}
              onClick={() => setActiveTableId(table.id)}
              className={`w-full flex items-center space-x-4 px-4 lg:px-8 py-3 text-sm font-black uppercase transition-all relative group ${activeTableId === table.id ? 'bg-black text-white' : 'text-gray-400 hover:text-black'
                }`}
            >
              <i className={`fas fa-table w-5 ${activeTableId === table.id ? 'text-[#FF5F1F]' : ''}`}></i>
              <span className="truncate">{table.name}</span>
            </button>
          ))}

          <div className="mt-8 p-4 lg:px-8 lg:py-6 text-[10px] font-black opacity-30 uppercase tracking-[0.3em] hidden lg:block border-t border-black/5">View_Options</div>
          {VIEW_SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveView(section.id)}
              className={`w-full flex items-center space-x-4 px-4 lg:px-8 py-5 text-sm font-black uppercase transition-all relative group ${activeView === section.id
                ? 'bg-black text-white'
                : 'text-gray-400 hover:text-black hover:bg-gray-50'
                }`}
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${activeView === section.id ? 'bg-[#FF5F1F]' : 'bg-transparent'}`}></div>
              <i className={`fas ${section.icon} w-5 text-lg ${activeView === section.id ? 'text-[#FF5F1F]' : 'group-hover:text-black'}`}></i>
              <span className="hidden lg:block tracking-widest">{section.title}</span>
            </button>
          ))}
        </nav>

        <div className="p-8 border-t-4 border-black">
          <div className="flex flex-col space-y-4">
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="bg-white border-2 border-black p-2 text-xs font-black uppercase hover:bg-black hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <i className="fas fa-cog"></i> Configure AI
            </button>
            <div className="bg-black p-3 text-center">
              <span className="text-[10px] font-black text-[#FF5F1F] uppercase italic">{activeTable.name}</span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-black opacity-40 uppercase">
              <span>Records</span>
              <span>{activeTable.rows.length}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar relative z-10 bg-white/50">
        <div className="min-h-full max-w-7xl mx-auto pb-32">
          {renderActiveView()}
        </div>

        {/* Floating Chat Button */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`fixed bottom-12 right-12 w-16 h-16 rounded-none flex items-center justify-center transition-all duration-300 z-50 group border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${isChatOpen ? 'bg-black text-white' : 'bg-[#FF5F1F] text-black hover:scale-105 active:translate-x-1 active:translate-y-1 active:shadow-none'
            }`}
        >
          {isChatOpen ? <i className="fas fa-times text-2xl"></i> : <i className="fas fa-robot text-2xl"></i>}
          {!isChatOpen && (
            <div className="absolute -top-3 -right-3 bg-black text-white text-[10px] font-black px-2 py-1 uppercase tracking-tighter animate-bounce border border-[#FF5F1F]">
              AI_Assistant
            </div>
          )}
        </button>

        {/* AI Chat Drawer */}
        {isChatOpen && (
          <div className="fixed bottom-32 right-12 w-[450px] h-[650px] bg-white border-4 border-black flex flex-col z-50 animate-slideUp shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
            <div className="p-6 bg-black text-white flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-[#FF5F1F] flex items-center justify-center text-black border-2 border-white shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                  <i className="fas fa-robot text-xl"></i>
                </div>
                <div>
                  <h4 className="font-black uppercase tracking-widest text-sm italic">AI_Assistant</h4>
                  <p className="text-[10px] text-[#FF5F1F] font-black tracking-[0.2em] uppercase">Powered by Gemini</p>
                </div>
              </div>
              <div className="text-[10px] font-black opacity-50 uppercase italic tracking-widest">Online</div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-50 blueprint-grid bg-fixed">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] p-4 rounded-none text-sm font-bold tracking-tight relative shadow-sm border-2 ${msg.role === 'user'
                    ? 'bg-black text-[#FF5F1F] border-[#FF5F1F]'
                    : 'bg-white text-black border-black'
                    }`}>
                    {msg.role === 'assistant' && <div className="text-[8px] font-black opacity-30 mb-2">// AI_RESPONSE</div>}
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    <div className={`text-[9px] mt-3 opacity-40 font-black`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-black text-[#FF5F1F] p-4 text-[10px] font-black animate-pulse uppercase italic border-l-4 border-[#FF5F1F]">
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-6 bg-white border-t-4 border-black">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask me anything..."
                  className="w-full bg-gray-50 px-6 py-5 border-2 border-black focus:outline-none focus:bg-white text-sm font-bold placeholder:opacity-20 transition-all focus:ring-4 focus:ring-[#FF5F1F]/10"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isTyping}
                  className="absolute right-4 top-4 w-12 h-12 bg-black text-[#FF5F1F] flex items-center justify-center hover:bg-[#FF5F1F] hover:text-black transition-all disabled:opacity-50"
                >
                  <i className="fas fa-paper-plane text-xl"></i>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes reveal {
          from { opacity: 0; transform: scale(0.98); filter: blur(4px); }
          to { opacity: 1; transform: scale(1); filter: blur(0); }
        }
        @keyframes slideUp {
          from { transform: translateY(50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-reveal { animation: reveal 0.6s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
        .animate-slideUp { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      {/* Modals */}
      <Modal isOpen={isFieldModalOpen} onClose={() => setIsFieldModalOpen(false)} title="New Field">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase mb-2">Field Name</label>
            <input
              autoFocus
              className="w-full border-2 border-black p-3 font-bold focus:outline-none focus:ring-4 focus:ring-[#FF5F1F]/20"
              value={newFieldData.name}
              onChange={e => setNewFieldData({ ...newFieldData, name: e.target.value })}
              onKeyPress={e => e.key === 'Enter' && addField()}
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase mb-2">Field Type</label>
            <div className="grid grid-cols-2 gap-2">
              {['TEXT', 'NUMBER', 'DATE', 'STATUS'].map(type => (
                <button
                  key={type}
                  onClick={() => setNewFieldData({ ...newFieldData, type: type as any })}
                  className={`p-3 border-2 border-black text-xs font-black uppercase transition-all ${newFieldData.type === type ? 'bg-black text-[#FF5F1F]' : 'bg-white hover:bg-gray-50'
                    }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={addField}
            className="w-full bg-[#FF5F1F] text-black font-black uppercase py-4 border-2 border-black hover:bg-black hover:text-[#FF5F1F] transition-all mt-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            Create Field
          </button>
        </div>
      </Modal>

      <Modal isOpen={isTableModalOpen} onClose={() => setIsTableModalOpen(false)} title="New Table">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase mb-2">Table Name</label>
            <input
              autoFocus
              className="w-full border-2 border-black p-3 font-bold focus:outline-none focus:ring-4 focus:ring-[#FF5F1F]/20"
              value={newTableName}
              onChange={e => setNewTableName(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && addTable()}
            />
          </div>
          <button
            onClick={addTable}
            className="w-full bg-[#FF5F1F] text-black font-black uppercase py-4 border-2 border-black hover:bg-black hover:text-[#FF5F1F] transition-all mt-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            Create Database
          </button>

          <div className="relative flex items-center gap-4 py-4 before:content-[''] before:h-px before:flex-1 before:bg-black/10 after:content-[''] after:h-px after:flex-1 after:bg-black/10">
            <span className="text-[10px] font-black uppercase opacity-40">OR IMPORT</span>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-white text-black font-black uppercase py-4 border-2 border-black border-dashed hover:border-solid hover:bg-black hover:text-white transition-all"
          >
            <i className="fas fa-file-import mr-2"></i> Import File (Excel/CSV/MD)
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".xlsx,.csv,.md" />
        </div>
      </Modal>

      <Modal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} title="AI Configuration">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase mb-2">AI Provider</label>
            <div className="grid grid-cols-3 gap-2">
              {['GEMINI', 'OPENAI', 'HUGGINGFACE'].map(p => (
                <button
                  key={p}
                  onClick={() => setAiConfig({ ...aiConfig, provider: p as any })}
                  className={`p-2 border-2 border-black text-[10px] font-black uppercase transition-all ${aiConfig.provider === p ? 'bg-black text-[#FF5F1F]' : 'bg-white hover:bg-gray-50'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-black uppercase mb-2">API Key</label>
            <input
              type="password"
              value={aiConfig.apiKey}
              onChange={e => setAiConfig({ ...aiConfig, apiKey: e.target.value })}
              className="w-full border-2 border-black p-3 font-mono text-xs font-bold focus:outline-none focus:ring-4 focus:ring-[#FF5F1F]/20"
              placeholder="sk-..."
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase mb-2">Model Name (Optional)</label>
            <input
              type="text"
              value={aiConfig.model}
              onChange={e => setAiConfig({ ...aiConfig, model: e.target.value })}
              className="w-full border-2 border-black p-3 font-mono text-xs font-bold focus:outline-none focus:ring-4 focus:ring-[#FF5F1F]/20"
              placeholder={aiConfig.provider === 'GEMINI' ? 'gemini-1.5-pro' : aiConfig.provider === 'OPENAI' ? 'gpt-4-turbo' : 'meta-llama/Meta-Llama-3-70B-Instruct'}
            />
            <p className="text-[10px] opacity-50 mt-2 font-mono">Leave empty to use recommended default.</p>
          </div>
          <button onClick={() => setIsSettingsModalOpen(false)} className="w-full bg-[#FF5F1F] text-black font-black uppercase py-4 border-2 border-black hover:bg-black hover:text-[#FF5F1F] transition-all mt-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
            Save Configuration
          </button>
        </div>
      </Modal>

      <Modal isOpen={isDataSourceModalOpen} onClose={() => setIsDataSourceModalOpen(false)} title="Link External Database">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase mb-2">Connection Name</label>
            <input
              autoFocus
              className="w-full border-2 border-black p-3 font-bold focus:outline-none focus:ring-4 focus:ring-[#FF5F1F]/20"
              placeholder="e.g. Production DB"
              value={newDataSource.name}
              onChange={e => setNewDataSource({ ...newDataSource, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase mb-2">Database Type</label>
            <div className="grid grid-cols-3 gap-2">
              {['POSTGRES', 'MONGODB', 'SQLITE'].map(t => (
                <button
                  key={t}
                  onClick={() => setNewDataSource({ ...newDataSource, type: t as any })}
                  className={`p-3 border-2 border-black text-[10px] font-black uppercase transition-all ${newDataSource.type === t ? 'bg-black text-[#FF5F1F]' : 'bg-white hover:bg-gray-50'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-black uppercase mb-2">Connection String / URL</label>
            <input
              className="w-full border-2 border-black p-3 font-mono text-xs font-bold focus:outline-none focus:ring-4 focus:ring-[#FF5F1F]/20"
              placeholder={newDataSource.type === 'POSTGRES' ? 'postgresql://user:pass@host:5432/db' : newDataSource.type === 'MONGODB' ? 'mongodb+srv://user:pass@cluster.mongodb.net/db' : 'file://path/to/db.sqlite'}
              value={newDataSource.connectionString}
              onChange={e => setNewDataSource({ ...newDataSource, connectionString: e.target.value })}
              onKeyPress={e => e.key === 'Enter' && addDataSource()}
            />
          </div>
          <button onClick={addDataSource} className="w-full bg-[#FF5F1F] text-black font-black uppercase py-4 border-2 border-black hover:bg-black hover:text-[#FF5F1F] transition-all mt-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
            Connect & Link
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default App;
