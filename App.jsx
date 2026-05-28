import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  CalendarDays,
  BriefcaseBusiness,
  User,
  Flag,
  Search,
  RotateCcw,
  Clock3,
  Users,
  AlertTriangle,
  Hourglass,
  BarChart3,
  ArrowRight,
  Target,
  WalletCards,
  Factory,
  ClipboardList,
} from "lucide-react";

const STORAGE_KEY = "daily_manager_app_v2";

function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function localISO(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toLocalDate(value) {
  if (!value) return new Date();
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDaysISO(value, days) {
  const d = toLocalDate(value);
  d.setDate(d.getDate() + days);
  return localISO(d);
}

function formatDate(value) {
  const d = toLocalDate(value);
  return d.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function todayISO() {
  return localISO(new Date());
}

const categoryOptions = [
  { value: "sales", label: "Kinh doanh", icon: BriefcaseBusiness },
  { value: "project", label: "Dự án", icon: Factory },
  { value: "customer", label: "Khách hàng", icon: Users },
  { value: "internal", label: "Nội bộ", icon: ClipboardList },
  { value: "finance", label: "Tài chính / Kế toán", icon: WalletCards },
  { value: "personal", label: "Cá nhân", icon: User },
];

const levelOptions = [
  { value: "urgent", label: "Khẩn cấp", short: "Khẩn", rank: 1, weight: 5 },
  { value: "high", label: "Quan trọng", short: "Quan trọng", rank: 2, weight: 3 },
  { value: "normal", label: "Bình thường", short: "Bình thường", rank: 3, weight: 1 },
  { value: "low", label: "Thấp", short: "Thấp", rank: 4, weight: 0.5 },
];

const statusOptions = [
  { value: "todo", label: "Chưa làm", icon: Circle },
  { value: "doing", label: "Đang làm", icon: Clock3 },
  { value: "waiting", label: "Chờ phản hồi", icon: Hourglass },
  { value: "blocked", label: "Bị vướng", icon: AlertTriangle },
  { value: "done", label: "Hoàn thành", icon: CheckCircle2 },
];

function getCategory(value) {
  return categoryOptions.find((item) => item.value === value) || categoryOptions[0];
}

function getLevel(value) {
  return levelOptions.find((item) => item.value === value) || levelOptions[2];
}

function getStatus(value) {
  return statusOptions.find((item) => item.value === value) || statusOptions[0];
}

function calcCountPercent(tasks) {
  if (!tasks.length) return 0;
  return Math.round((tasks.filter((task) => task.status === "done").length / tasks.length) * 100);
}

function calcWeightedPercent(tasks) {
  const total = tasks.reduce((sum, task) => sum + getLevel(task.level).weight, 0);
  if (!total) return 0;
  const done = tasks.filter((task) => task.status === "done").reduce((sum, task) => sum + getLevel(task.level).weight, 0);
  return Math.round((done / total) * 100);
}

function scoreDone(tasks) {
  return tasks.filter((task) => task.status === "done").reduce((sum, task) => sum + getLevel(task.level).weight, 0);
}

function scoreTotal(tasks) {
  return tasks.reduce((sum, task) => sum + getLevel(task.level).weight, 0);
}

function isOverdue(task, selectedDate) {
  if (!task.dueTime || task.status === "done") return false;
  if (selectedDate !== todayISO()) return false;
  const now = new Date();
  const [h, m] = task.dueTime.split(":").map(Number);
  const due = new Date();
  due.setHours(h, m || 0, 0, 0);
  return now > due;
}

function levelClass(level) {
  if (level === "urgent") return "danger";
  if (level === "high") return "warning";
  if (level === "normal") return "info";
  return "muted";
}

function statusClass(status, overdue) {
  if (overdue) return "danger";
  if (status === "done") return "success";
  if (status === "blocked") return "danger";
  if (status === "waiting") return "purple";
  if (status === "doing") return "warning";
  return "muted";
}

function createSampleTasks() {
  return [
    {
      id: makeId(),
      title: "Rà soát các deal / công trình cần xử lý trong ngày",
      category: "sales",
      level: "high",
      status: "doing",
      owner: "Tôi",
      dueTime: "09:00",
      result: "Chốt danh sách việc ưu tiên trong ngày",
      project: "Quản lý chung",
      note: "",
      date: todayISO(),
      createdAt: new Date().toISOString(),
      carriedFrom: "",
    },
    {
      id: makeId(),
      title: "Follow khách hàng / nhân sự đang chờ phản hồi",
      category: "customer",
      level: "urgent",
      status: "waiting",
      owner: "Sale / khách hàng",
      dueTime: "15:00",
      result: "Có phản hồi rõ ràng để chốt bước tiếp theo",
      project: "Follow trong ngày",
      note: "",
      date: todayISO(),
      createdAt: new Date().toISOString(),
      carriedFrom: "",
    },
    {
      id: makeId(),
      title: "Kiểm tra việc cá nhân cần hoàn thành hôm nay",
      category: "personal",
      level: "normal",
      status: "todo",
      owner: "Tôi",
      dueTime: "20:00",
      result: "Không bỏ sót việc cá nhân quan trọng",
      project: "Cá nhân",
      note: "",
      date: todayISO(),
      createdAt: new Date().toISOString(),
      carriedFrom: "",
    },
  ];
}

function MiniStat({ label, value, sub, icon: Icon }) {
  return (
    <div className="card mini-stat">
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
        {sub && <p className="stat-sub">{sub}</p>}
      </div>
      <div className="icon-box">
        <Icon size={20} />
      </div>
    </div>
  );
}

function ProgressCard({ title, percent, done, total, icon: Icon }) {
  return (
    <div className="card">
      <div className="progress-row">
        <div className="progress-title">
          <div className="icon-box small">
            <Icon size={19} />
          </div>
          <div>
            <p className="card-title">{title}</p>
            <p className="muted-text">{done}/{total} việc đã xong</p>
          </div>
        </div>
        <div className="percent">{percent}%</div>
      </div>
      <div className="bar">
        <div className="bar-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function Badge({ children, tone = "muted" }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

function TaskItem({ task, selectedDate, onToggleDone, onDelete, onPatch }) {
  const category = getCategory(task.category);
  const CategoryIcon = category.icon;
  const level = getLevel(task.level);
  const status = getStatus(task.status);
  const StatusIcon = status.icon;
  const overdue = isOverdue(task, selectedDate);

  return (
    <div className={`card task-card ${overdue ? "overdue-card" : ""} ${task.status === "done" ? "done-card" : ""}`}>
      <div className="task-layout">
        <button onClick={() => onToggleDone(task.id)} className="check-button">
          {task.status === "done" ? <CheckCircle2 size={27} /> : <Circle size={27} />}
        </button>

        <div className="task-body">
          <input
            value={task.title}
            onChange={(event) => onPatch(task.id, { title: event.target.value })}
            className={`task-title-input ${task.status === "done" ? "done-title" : ""}`}
          />

          <div className="badge-list">
            <Badge>
              <CategoryIcon size={12} /> {category.label}
            </Badge>
            <Badge tone={levelClass(task.level)}>
              <Flag size={12} /> {level.short} · {level.weight}đ
            </Badge>
            <Badge tone={statusClass(task.status, overdue)}>
              <StatusIcon size={12} /> {overdue ? "Quá giờ" : status.label}
            </Badge>
            {task.dueTime && (
              <Badge>
                <Clock3 size={12} /> {task.dueTime}
              </Badge>
            )}
          </div>

          <div className="task-fields">
            <div className="two-cols">
              <select value={task.category} onChange={(event) => onPatch(task.id, { category: event.target.value })} className="field">
                {categoryOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <select value={task.level} onChange={(event) => onPatch(task.id, { level: event.target.value })} className="field">
                {levelOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>

            <div className="two-cols">
              <select value={task.status} onChange={(event) => onPatch(task.id, { status: event.target.value })} className="field">
                {statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <input type="time" value={task.dueTime || ""} onChange={(event) => onPatch(task.id, { dueTime: event.target.value })} className="field" />
            </div>

            <input value={task.owner || ""} onChange={(event) => onPatch(task.id, { owner: event.target.value })} placeholder="Người phụ trách / người cần follow" className="field soft" />
            <input value={task.project || ""} onChange={(event) => onPatch(task.id, { project: event.target.value })} placeholder="Dự án / khách hàng liên quan" className="field soft" />
            <input value={task.result || ""} onChange={(event) => onPatch(task.id, { result: event.target.value })} placeholder="Kết quả cần đạt" className="field soft" />
            <textarea value={task.note || ""} onChange={(event) => onPatch(task.id, { note: event.target.value })} placeholder="Ghi chú nhanh..." className="field soft textarea" />
          </div>

          {task.carriedFrom && <p className="carry-note">Được chuyển từ ngày {task.carriedFrom}</p>}
        </div>

        <button onClick={() => onDelete(task.id)} className="delete-button">
          <Trash2 size={17} />
        </button>
      </div>
    </div>
  );
}

function ReportList({ title, items, empty }) {
  return (
    <div>
      <p className="report-title">{title}</p>
      {items.length === 0 ? (
        <p className="empty-line">{empty}</p>
      ) : (
        <div className="report-items">
          {items.map((task) => (
            <div key={task.id} className="report-item">
              <p className="report-task">{task.title}</p>
              <p className="report-meta">
                {getCategory(task.category).label} · {getLevel(task.level).label}
                {task.owner ? ` · ${task.owner}` : ""}
                {task.dueTime ? ` · ${task.dueTime}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DailyReport({ tasks }) {
  const unfinishedImportant = tasks
    .filter((task) => task.status !== "done" && ["urgent", "high"].includes(task.level))
    .sort((a, b) => getLevel(a.level).rank - getLevel(b.level).rank)
    .slice(0, 5);

  const waiting = tasks.filter((task) => task.status === "waiting").slice(0, 5);
  const blocked = tasks.filter((task) => task.status === "blocked").slice(0, 5);

  return (
    <section className="card report-card">
      <div className="section-heading">
        <h2><BarChart3 size={18} /> Báo cáo cuối ngày</h2>
        <span>{calcCountPercent(tasks)}% số việc · {calcWeightedPercent(tasks)}% điểm</span>
      </div>
      <ReportList title="Việc quan trọng chưa xong" items={unfinishedImportant} empty="Không còn việc quan trọng tồn." />
      <ReportList title="Việc đang chờ phản hồi" items={waiting} empty="Không có việc đang chờ." />
      <ReportList title="Việc bị vướng" items={blocked} empty="Không có việc bị vướng." />
    </section>
  );
}

export default function App() {
  const [tasks, setTasks] = useState(createSampleTasks());
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("sales");
  const [newLevel, setNewLevel] = useState("normal");
  const [newOwner, setNewOwner] = useState("");
  const [newDueTime, setNewDueTime] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setTasks(JSON.parse(raw));
    } catch (error) {
      console.error("Cannot load tasks", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error("Cannot save tasks", error);
    }
  }, [tasks]);

  const dayTasks = useMemo(() => tasks.filter((task) => task.date === selectedDate), [tasks, selectedDate]);

  const visibleTasks = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return dayTasks
      .filter((task) => {
        if (filter === "all") return true;
        if (filter === "important") return ["urgent", "high"].includes(task.level);
        if (filter === "waiting") return task.status === "waiting";
        if (filter === "blocked") return task.status === "blocked";
        if (filter === "done") return task.status === "done";
        return task.category === filter || task.level === filter || task.status === filter;
      })
      .filter((task) => {
        const text = `${task.title} ${task.owner || ""} ${task.project || ""} ${task.result || ""} ${task.note || ""}`.toLowerCase();
        return !keyword || text.includes(keyword);
      })
      .sort((a, b) => {
        if (a.status === "done" && b.status !== "done") return 1;
        if (a.status !== "done" && b.status === "done") return -1;
        if (isOverdue(a, selectedDate) !== isOverdue(b, selectedDate)) return isOverdue(a, selectedDate) ? -1 : 1;
        if (getLevel(a.level).rank !== getLevel(b.level).rank) return getLevel(a.level).rank - getLevel(b.level).rank;
        return (a.dueTime || "99:99").localeCompare(b.dueTime || "99:99");
      });
  }, [dayTasks, filter, search, selectedDate]);

  const companyTasks = dayTasks.filter((task) => task.category !== "personal");
  const personalTasks = dayTasks.filter((task) => task.category === "personal");
  const waitingCount = dayTasks.filter((task) => task.status === "waiting").length;
  const blockedCount = dayTasks.filter((task) => task.status === "blocked").length;
  const overdueCount = dayTasks.filter((task) => isOverdue(task, selectedDate)).length;
  const undoneCount = dayTasks.filter((task) => task.status !== "done").length;

  const categoryStats = categoryOptions.map((category) => {
    const list = dayTasks.filter((task) => task.category === category.value);
    return {
      ...category,
      total: list.length,
      done: list.filter((task) => task.status === "done").length,
      percent: calcWeightedPercent(list),
    };
  });

  function addTask() {
    const title = newTitle.trim();
    if (!title) return;

    setTasks((prev) => [
      {
        id: makeId(),
        title,
        category: newCategory,
        level: newLevel,
        status: "todo",
        owner: newOwner.trim(),
        dueTime: newDueTime,
        result: "",
        project: "",
        note: "",
        date: selectedDate,
        createdAt: new Date().toISOString(),
        carriedFrom: "",
      },
      ...prev,
    ]);
    setNewTitle("");
    setNewOwner("");
    setNewDueTime("");
  }

  function toggleDone(id) {
    setTasks((prev) => prev.map((task) => {
      if (task.id !== id) return task;
      return { ...task, status: task.status === "done" ? "todo" : "done" };
    }));
  }

  function patchTask(id, patch) {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, ...patch } : task)));
  }

  function deleteTask(id) {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }

  function resetSample() {
    const ok = window.confirm("Bạn muốn xoá toàn bộ dữ liệu và tạo lại dữ liệu mẫu?");
    if (!ok) return;
    setTasks(createSampleTasks());
    setSelectedDate(todayISO());
  }

  function carryToTomorrow() {
    const tomorrow = addDaysISO(selectedDate, 1);
    const unfinished = dayTasks.filter((task) => task.status !== "done");
    if (!unfinished.length) return;

    const ok = window.confirm(`Chuyển ${unfinished.length} việc chưa xong sang ngày mai?`);
    if (!ok) return;

    const copied = unfinished.map((task) => ({
      ...task,
      id: makeId(),
      date: tomorrow,
      status: task.status === "blocked" || task.status === "waiting" ? task.status : "todo",
      carriedFrom: selectedDate,
      createdAt: new Date().toISOString(),
    }));
    setTasks((prev) => [...copied, ...prev]);
    setSelectedDate(tomorrow);
  }

  return (
    <div className="app">
      <header className="hero">
        <div className="container hero-inner">
          <div className="hero-top">
            <div>
              <p className="hero-sub">Daily Manager App</p>
              <h1>Quản lý ngày làm việc</h1>
              <p className="date-text">{formatDate(selectedDate)}</p>
            </div>
            <button onClick={resetSample} className="reset-button" aria-label="Tạo lại dữ liệu mẫu">
              <RotateCcw size={18} />
            </button>
          </div>

          <div className="summary-card">
            <div className="summary-row">
              <div>
                <p className="summary-label">Điểm hiệu quả hôm nay</p>
                <p className="big-percent">{calcWeightedPercent(dayTasks)}%</p>
                <p className="summary-sub">{scoreDone(dayTasks)}/{scoreTotal(dayTasks)} điểm ưu tiên</p>
              </div>
              <div className="summary-right">
                <p className="summary-label">Tỉ lệ checklist</p>
                <p className="medium-percent">{calcCountPercent(dayTasks)}%</p>
                <p className="summary-sub">{dayTasks.filter((task) => task.status === "done").length}/{dayTasks.length} việc</p>
              </div>
            </div>
            <div className="bar">
              <div className="bar-fill" style={{ width: `${calcWeightedPercent(dayTasks)}%` }} />
            </div>
          </div>
        </div>
      </header>

      <main className="container main">
        <section className="stat-grid">
          <MiniStat label="Chờ phản hồi" value={waitingCount} sub="Cần follow" icon={Hourglass} />
          <MiniStat label="Bị vướng" value={blockedCount} sub="Cần gỡ nút thắt" icon={AlertTriangle} />
          <MiniStat label="Quá giờ" value={overdueCount} sub="Theo giờ hôm nay" icon={Clock3} />
          <MiniStat label="Việc tồn" value={undoneCount} sub="Chưa hoàn thành" icon={ClipboardList} />
        </section>

        <section className="card input-card">
          <div className="date-input-row">
            <CalendarDays size={18} />
            <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
          </div>

          <input
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") addTask();
            }}
            placeholder="Nhập việc cần làm..."
            className="main-input"
          />

          <div className="two-cols">
            <select value={newCategory} onChange={(event) => setNewCategory(event.target.value)} className="field">
              {categoryOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <select value={newLevel} onChange={(event) => setNewLevel(event.target.value)} className="field">
              {levelOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </div>

          <div className="two-cols">
            <input value={newOwner} onChange={(event) => setNewOwner(event.target.value)} placeholder="Người cần follow" className="field" />
            <input type="time" value={newDueTime} onChange={(event) => setNewDueTime(event.target.value)} className="field" />
          </div>

          <button onClick={addTask} className="add-button">
            <Plus size={18} /> Thêm công việc
          </button>
        </section>

        <section className="progress-stack">
          <ProgressCard title="Việc công ty" icon={BriefcaseBusiness} total={companyTasks.length} done={companyTasks.filter((task) => task.status === "done").length} percent={calcWeightedPercent(companyTasks)} />
          <ProgressCard title="Việc cá nhân" icon={User} total={personalTasks.length} done={personalTasks.filter((task) => task.status === "done").length} percent={calcWeightedPercent(personalTasks)} />
        </section>

        <section className="card category-card">
          <h2 className="section-title"><Target size={18} /> Tỉ lệ theo nhóm việc</h2>
          <div className="category-list">
            {categoryStats.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.value}>
                  <div className="category-row">
                    <span><Icon size={14} /> {item.label}</span>
                    <span>{item.done}/{item.total} · {item.percent}%</span>
                  </div>
                  <div className="small-bar">
                    <div className="small-bar-fill" style={{ width: `${item.percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="task-section">
          <div className="card search-card">
            <Search size={18} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm việc, khách hàng, người phụ trách..." />
          </div>

          <div className="filter-row">
            {[
              ["all", "Tất cả"],
              ["important", "Quan trọng"],
              ["waiting", "Chờ phản hồi"],
              ["blocked", "Bị vướng"],
              ["sales", "Kinh doanh"],
              ["project", "Dự án"],
              ["finance", "Kế toán"],
              ["personal", "Cá nhân"],
              ["done", "Đã xong"],
            ].map(([value, label]) => (
              <button key={value} onClick={() => setFilter(value)} className={`filter-chip ${filter === value ? "active" : ""}`}>
                {label}
              </button>
            ))}
          </div>

          {visibleTasks.length === 0 ? (
            <div className="card empty-card">
              <CheckCircle2 size={44} />
              <p>Chưa có công việc phù hợp</p>
              <span>Nhập việc mới hoặc đổi bộ lọc.</span>
            </div>
          ) : (
            <div className="task-list">
              {visibleTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  selectedDate={selectedDate}
                  onToggleDone={toggleDone}
                  onDelete={deleteTask}
                  onPatch={patchTask}
                />
              ))}
            </div>
          )}
        </section>

        <DailyReport tasks={dayTasks} />

        <button onClick={carryToTomorrow} className="carry-button">
          Chuyển việc chưa xong sang ngày mai <ArrowRight size={18} />
        </button>
      </main>
    </div>
  );
}
