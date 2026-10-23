import { useEffect, useState } from "react";
import "./App.css";

const COLORS = [
  "#ffffff",
  "#fef3c7",
  "#dcfce7",
  "#dbeafe",
  "#fce7f3",
  "#ede9fe",
];

function App() {
  const [notes, setNotes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("notes")) || [];
    } catch {
      return [];
    }
  });

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("#ffffff");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showArchive, setShowArchive] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    localStorage.setItem("notes", JSON.stringify(notes));
  }, [notes]);

  function handleSubmit(e) {
    e.preventDefault();

    const cleanTitle = title.trim();
    const cleanContent = content.trim();

    if (!cleanContent) {
      setError("Please enter note content.");
      return;
    }

    if (cleanTitle.length > 100) {
      setError("Title cannot exceed 100 characters.");
      return;
    }

    if (cleanContent.length > 5000) {
      setError("Content cannot exceed 5000 characters.");
      return;
    }

    const duplicate = notes.some(
      (note) =>
        note.id !== editingId &&
        note.title.toLowerCase() === cleanTitle.toLowerCase() &&
        note.content.toLowerCase() === cleanContent.toLowerCase()
    );

    if (duplicate) {
      setError("This note already exists.");
      return;
    }

    const now = new Date().toISOString();

    if (editingId) {
      setNotes((prev) =>
        prev.map((note) =>
          note.id === editingId
            ? {
                ...note,
                title: cleanTitle,
                content: cleanContent,
                color,
                updatedAt: now,
              }
            : note
        )
      );
    } else {
      setNotes((prev) => [
        {
          id: crypto.randomUUID(),
          title: cleanTitle,
          content: cleanContent,
          color,
          pinned: false,
          archived: false,
          createdAt: now,
          updatedAt: now,
        },
        ...prev,
      ]);
    }

    resetForm();
  }

  function resetForm() {
    setTitle("");
    setContent("");
    setColor("#ffffff");
    setEditingId(null);
    setError("");
  }

  function editNote(note) {
    setTitle(note.title);
    setContent(note.content);
    setColor(note.color);
    setEditingId(note.id);
    setShowArchive(false);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteNote(id) {
    if (!window.confirm("Are you sure you want to delete this note?")) {
      return;
    }

    setNotes((prev) => prev.filter((note) => note.id !== id));
  }

  function togglePin(id) {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id ? { ...note, pinned: !note.pinned } : note
      )
    );
  }

  function toggleArchive(id) {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id ? { ...note, archived: !note.archived } : note
      )
    );
  }

  const visibleNotes = notes
    .filter((note) => note.archived === showArchive)
    .filter((note) =>
      `${note.title} ${note.content}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
    .sort((a, b) => Number(b.pinned) - Number(a.pinned));

  return (
    <div className="app">
      <header className="header">
        <h1>📝 NoteSpace</h1>

        <input
          className="search"
          type="search"
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button
          className={!showArchive ? "nav-button active" : "nav-button"}
          onClick={() => setShowArchive(false)}
        >
          My Notes
        </button>

        <button
          className={showArchive ? "nav-button active" : "nav-button"}
          onClick={() => setShowArchive(true)}
        >
          Archive
        </button>
      </header>

      <main className="container">
        {!showArchive && (
          <form
            className="note-form"
            onSubmit={handleSubmit}
            style={{ backgroundColor: color }}
          >
            <input
              type="text"
              placeholder="Title (optional)"
              value={title}
              maxLength={100}
              onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
              placeholder="Write your note..."
              value={content}
              maxLength={5000}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
            />

            <div className="color-picker">
              {COLORS.map((item) => (
                <button
                  key={item}
                  type="button"
                  title={item}
                  aria-label={`Select ${item} color`}
                  onClick={() => setColor(item)}
                  className={color === item ? "color selected" : "color"}
                  style={{ backgroundColor: item }}
                />
              ))}
            </div>

            {error && <p className="error">{error}</p>}

            <div className="form-actions">
              {editingId && (
                <button
                  type="button"
                  className="cancel-button"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}

              <button type="submit" className="save-button">
                {editingId ? "Update Note" : "Add Note"}
              </button>
            </div>
          </form>
        )}

        <div className="section-heading">
          <h2>{showArchive ? "Archived Notes" : "Your Notes"}</h2>
          <span>{visibleNotes.length} notes</span>
        </div>

        {visibleNotes.length === 0 ? (
          <div className="empty-state">
            <span>📒</span>
            <h3>{search ? "No notes found" : "No notes yet"}</h3>
            <p>
              {search
                ? "Try searching with another word."
                : "Create your first note above."}
            </p>
          </div>
        ) : (
          <div className="notes-grid">
            {visibleNotes.map((note) => (
              <article
                className="note-card"
                key={note.id}
                style={{ backgroundColor: note.color }}
              >
                <div className="note-top">
                  <h3>{note.title || "Untitled"}</h3>

                  <button
                    className="icon-button"
                    title={note.pinned ? "Unpin note" : "Pin note"}
                    onClick={() => togglePin(note.id)}
                  >
                    {note.pinned ? "📌" : "📍"}
                  </button>
                </div>

                <p className="note-content">{note.content}</p>

                <div className="note-date">
                  Updated: {new Date(note.updatedAt).toLocaleString()}
                </div>

                <div className="note-actions">
                  {!note.archived && (
                    <button onClick={() => editNote(note)}>Edit</button>
                  )}

                  <button onClick={() => toggleArchive(note.id)}>
                    {note.archived ? "Unarchive" : "Archive"}
                  </button>

                  <button
                    className="delete-button"
                    onClick={() => deleteNote(note.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;