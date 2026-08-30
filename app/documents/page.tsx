"use client";

import { useState, useMemo } from "react";
import {
  IconFiles, IconPlus, IconPencil, IconTrash, IconX,
  IconFolder, IconLink, IconNotes, IconSearch,
  IconChevronRight, IconHome2, IconExternalLink,
  IconEye, IconFolderPlus, IconCheck,
} from "@tabler/icons-react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import {
  useDocuments,
  DEFAULT_DOC_CATEGORIES,
  type Document,
  type DocFolder,
  type DocType,
} from "@/context/DocumentsContext";

// ── Styles ────────────────────────────────────────────────────────────────────

const IN: React.CSSProperties = {
  width: "100%", padding: "9px 12px", border: "1px solid #e4e2dc",
  borderRadius: 8, background: "#fafaf9", color: "#1c1c1a",
  fontSize: 13, outline: "none",
  fontFamily: "var(--font-inter), sans-serif",
  boxSizing: "border-box",
};
const LBL: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 500,
  textTransform: "uppercase", letterSpacing: "0.08em",
  marginBottom: 6, color: "#9e9b93",
};
const TA: React.CSSProperties = {
  ...IN, resize: "vertical", minHeight: 120,
};

// ── Category colours ──────────────────────────────────────────────────────────

const CAT_COLOR: Record<string, { bg: string; text: string }> = {
  Legal:       { bg: "rgba(45,90,138,0.13)",   text: "#2d5a8a" },
  Insurance:   { bg: "rgba(59,158,149,0.12)",  text: "#16645d" },
  Warranties:  { bg: "rgba(192,128,64,0.13)",  text: "#7a4e10" },
  Utilities:   { bg: "rgba(201,168,76,0.15)",  text: "#7a5e10" },
  Contracts:   { bg: "rgba(155,111,163,0.13)", text: "#5a3460" },
  Reference:   { bg: "rgba(127,168,130,0.15)", text: "#3d5e3f" },
  Other:       { bg: "#f0ede8",                text: "#6b6960" },
};

function catStyle(cat: string) {
  return CAT_COLOR[cat] ?? { bg: "#f0ede8", text: "#6b6960" };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDocPath(doc: Document, folders: DocFolder[]): string {
  if (!doc.folderId) return "Root";
  const parts: string[] = [];
  let current: string | undefined = doc.folderId;
  while (current) {
    const f = folders.find(x => x.id === current);
    if (!f) break;
    parts.unshift(f.name);
    current = f.parentId;
  }
  return ["Root", ...parts].join(" › ");
}

// ── Form types ────────────────────────────────────────────────────────────────

type DocForm = {
  name: string;
  category: string;
  customCategory: string;
  type: DocType;
  url: string;
  content: string;
  folderId: string;
};

const emptyDocForm = (): DocForm => ({
  name: "", category: "Other", customCategory: "",
  type: "link", url: "", content: "", folderId: "",
});

// ── Subcomponents ─────────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: string }) {
  const { bg, text } = catStyle(category);
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: 20,
      fontSize: 10, fontWeight: 600, letterSpacing: "0.06em",
      background: bg, color: text,
    }}>
      {category}
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const {
    documents, folders, customCategories, loading,
    addDocument, updateDocument, removeDocument,
    addFolder, updateFolder, removeFolder,
    addCategory,
  } = useDocuments();

  const allCategories = [...DEFAULT_DOC_CATEGORIES, ...customCategories];

  // Navigation state
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<{ id: string; name: string }[]>([]);

  // Search
  const [search, setSearch] = useState("");
  const isSearching = search.trim().length > 0;

  // Modals
  const [docModal,    setDocModal]    = useState<"add" | "edit" | null>(null);
  const [editingDoc,  setEditingDoc]  = useState<Document | null>(null);
  const [docForm,     setDocForm]     = useState<DocForm>(emptyDocForm());

  const [folderModal,    setFolderModal]    = useState<"add" | "edit" | null>(null);
  const [editingFolder,  setEditingFolder]  = useState<DocFolder | null>(null);
  const [folderName,     setFolderName]     = useState("");

  const [viewNote, setViewNote] = useState<Document | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<{ type: "doc" | "folder"; id: string; name: string } | null>(null);

  const [newCatInput, setNewCatInput] = useState("");
  const [showCatInput, setShowCatInput] = useState(false);

  // ── Navigation ──────────────────────────────────────────────────────────────

  function navigateInto(folder: DocFolder) {
    setCurrentFolderId(folder.id);
    setFolderPath(prev => [...prev, { id: folder.id, name: folder.name }]);
  }

  function navigateTo(idx: number | null) {
    if (idx === null) {
      setCurrentFolderId(null);
      setFolderPath([]);
    } else {
      const newPath = folderPath.slice(0, idx + 1);
      setCurrentFolderId(newPath[newPath.length - 1]?.id ?? null);
      setFolderPath(newPath);
    }
  }

  // ── Filtered views ──────────────────────────────────────────────────────────

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const q = search.trim().toLowerCase();
    return documents.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q) ||
      (d.type === "note" && (d.content ?? "").toLowerCase().includes(q))
    );
  }, [documents, search, isSearching]);

  const visibleFolders = useMemo(() =>
    folders.filter(f => (f.parentId ?? null) === currentFolderId),
    [folders, currentFolderId]
  );

  const visibleDocs = useMemo(() =>
    documents.filter(d => (d.folderId ?? null) === currentFolderId),
    [documents, currentFolderId]
  );

  // ── Doc modal helpers ───────────────────────────────────────────────────────

  function openAddDoc() {
    setDocForm({ ...emptyDocForm(), folderId: currentFolderId ?? "" });
    setEditingDoc(null);
    setDocModal("add");
  }

  function openEditDoc(doc: Document) {
    setDocForm({
      name:           doc.name,
      category:       doc.category,
      customCategory: "",
      type:           doc.type,
      url:            doc.url ?? "",
      content:        doc.content ?? "",
      folderId:       doc.folderId ?? "",
    });
    setEditingDoc(doc);
    setDocModal("edit");
  }

  function saveDoc() {
    const category = docForm.customCategory.trim() || docForm.category;
    if (docForm.customCategory.trim()) addCategory(docForm.customCategory.trim());

    const data = {
      name:     docForm.name.trim(),
      category,
      type:     docForm.type,
      url:      docForm.type === "link" ? docForm.url.trim() : undefined,
      content:  docForm.type === "note" ? docForm.content : undefined,
      folderId: docForm.folderId || undefined,
    };

    if (docModal === "edit" && editingDoc) {
      updateDocument(editingDoc.id, data);
    } else {
      addDocument(data);
    }
    setDocModal(null);
  }

  // ── Folder modal helpers ─────────────────────────────────────────────────────

  function openAddFolder() {
    setFolderName("");
    setEditingFolder(null);
    setFolderModal("add");
  }

  function openEditFolder(folder: DocFolder) {
    setFolderName(folder.name);
    setEditingFolder(folder);
    setFolderModal("edit");
  }

  function saveFolder() {
    const name = folderName.trim();
    if (!name) return;
    if (folderModal === "edit" && editingFolder) {
      updateFolder(editingFolder.id, { name });
      setFolderPath(prev => prev.map(p => p.id === editingFolder.id ? { ...p, name } : p));
    } else {
      addFolder({ name, parentId: currentFolderId ?? undefined });
    }
    setFolderModal(null);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Topbar />
        <main style={{ flex: 1, overflow: "auto", background: "#f5f4f1" }}>
          <div style={{ padding: "28px 32px", maxWidth: 1100 }}>

            {/* ── Page header ──────────────────────────────────────────── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <IconFiles size={22} color="#3b9e95" strokeWidth={1.75} />
                <h1 style={{ fontSize: 18, fontWeight: 600, color: "#1c1c1a", margin: 0 }}>Documents</h1>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={openAddFolder} style={outlineBtn}>
                  <IconFolderPlus size={14} strokeWidth={2} />
                  New Folder
                </button>
                <button onClick={openAddDoc} style={primaryBtn}>
                  <IconPlus size={14} strokeWidth={2.5} />
                  New Document
                </button>
              </div>
            </div>

            {/* ── Search bar ───────────────────────────────────────────── */}
            <div style={{ position: "relative", marginBottom: 20 }}>
              <IconSearch
                size={14} color="#9e9b93" strokeWidth={2}
                style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search documents by name, category, or content…"
                style={{ ...IN, paddingLeft: 34 }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 2 }}
                >
                  <IconX size={13} color="#9e9b93" />
                </button>
              )}
            </div>

            {/* ── Breadcrumb (when not searching) ──────────────────────── */}
            {!isSearching && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 20, flexWrap: "wrap" }}>
                <button
                  onClick={() => navigateTo(null)}
                  style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "3px 6px", borderRadius: 6, color: currentFolderId ? "#3b9e95" : "#1c1c1a", fontSize: 13, fontWeight: currentFolderId ? 400 : 600 }}
                >
                  <IconHome2 size={13} strokeWidth={2} />
                  Root
                </button>
                {folderPath.map((f, idx) => (
                  <span key={f.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <IconChevronRight size={12} color="#c5c3bc" />
                    <button
                      onClick={() => navigateTo(idx)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: "3px 6px", borderRadius: 6, color: idx === folderPath.length - 1 ? "#1c1c1a" : "#3b9e95", fontSize: 13, fontWeight: idx === folderPath.length - 1 ? 600 : 400 }}
                    >
                      {f.name}
                    </button>
                  </span>
                ))}
              </div>
            )}

            {loading ? (
              <div style={{ color: "#9e9b93", fontSize: 13, paddingTop: 40, textAlign: "center" }}>Loading…</div>
            ) : isSearching ? (
              // ── Search results ────────────────────────────────────────
              <>
                <div style={{ fontSize: 12, color: "#9e9b93", marginBottom: 12 }}>
                  {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for &ldquo;{search}&rdquo;
                </div>
                {searchResults.length === 0 ? (
                  <EmptyState icon={<IconSearch size={32} color="#c5c3bc" />} text="No documents match your search." />
                ) : (
                  <div style={grid}>
                    {searchResults.map(doc => (
                      <DocCard
                        key={doc.id}
                        doc={doc}
                        folders={folders}
                        showPath
                        onOpen={() => doc.type === "link" ? window.open(doc.url, "_blank") : setViewNote(doc)}
                        onEdit={() => openEditDoc(doc)}
                        onDelete={() => setConfirmDelete({ type: "doc", id: doc.id, name: doc.name })}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              // ── Normal folder view ────────────────────────────────────
              <>
                {visibleFolders.length === 0 && visibleDocs.length === 0 ? (
                  <EmptyState
                    icon={<IconFiles size={32} color="#c5c3bc" />}
                    text={currentFolderId ? "This folder is empty." : "No documents yet. Create a folder or add a document."}
                  />
                ) : (
                  <div style={grid}>
                    {visibleFolders.map(folder => (
                      <FolderCard
                        key={folder.id}
                        folder={folder}
                        docCount={documents.filter(d => d.folderId === folder.id).length}
                        folderCount={folders.filter(f => f.parentId === folder.id).length}
                        onClick={() => navigateInto(folder)}
                        onEdit={() => openEditFolder(folder)}
                        onDelete={() => setConfirmDelete({ type: "folder", id: folder.id, name: folder.name })}
                      />
                    ))}
                    {visibleDocs.map(doc => (
                      <DocCard
                        key={doc.id}
                        doc={doc}
                        folders={folders}
                        onOpen={() => doc.type === "link" ? window.open(doc.url, "_blank") : setViewNote(doc)}
                        onEdit={() => openEditDoc(doc)}
                        onDelete={() => setConfirmDelete({ type: "doc", id: doc.id, name: doc.name })}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* ── Document modal ───────────────────────────────────────────────────── */}
      {docModal && (
        <ModalOverlay onClose={() => setDocModal(null)}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#1c1c1a", marginBottom: 20 }}>
            {docModal === "add" ? "Add Document" : "Edit Document"}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Name */}
            <div>
              <label style={LBL}>Name</label>
              <input style={IN} value={docForm.name} onChange={e => setDocForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Homeowners Insurance Policy" />
            </div>

            {/* Type */}
            <div>
              <label style={LBL}>Type</label>
              <div style={{ display: "flex", gap: 8 }}>
                {(["link", "note"] as DocType[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setDocForm(f => ({ ...f, type: t }))}
                    style={{
                      flex: 1, padding: "8px 12px", borderRadius: 8, fontSize: 13, cursor: "pointer",
                      border: `1.5px solid ${docForm.type === t ? "#3b9e95" : "#e4e2dc"}`,
                      background: docForm.type === t ? "rgba(59,158,149,0.08)" : "#fafaf9",
                      color: docForm.type === t ? "#16645d" : "#6b6960",
                      fontWeight: docForm.type === t ? 600 : 400,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}
                  >
                    {t === "link" ? <IconLink size={14} /> : <IconNotes size={14} />}
                    {t === "link" ? "Link" : "Note"}
                  </button>
                ))}
              </div>
            </div>

            {/* URL or Content */}
            {docForm.type === "link" ? (
              <div>
                <label style={LBL}>URL</label>
                <input style={IN} value={docForm.url} onChange={e => setDocForm(f => ({ ...f, url: e.target.value }))} placeholder="https://drive.google.com/…" type="url" />
              </div>
            ) : (
              <div>
                <label style={LBL}>Content</label>
                <textarea style={TA} value={docForm.content} onChange={e => setDocForm(f => ({ ...f, content: e.target.value }))} placeholder="WiFi password: MyPassword123&#10;Network: SelahHouse_5G&#10;…" />
              </div>
            )}

            {/* Category */}
            <div>
              <label style={LBL}>Category</label>
              <select style={IN} value={docForm.category} onChange={e => setDocForm(f => ({ ...f, category: e.target.value, customCategory: "" }))}>
                {allCategories.map(c => <option key={c}>{c}</option>)}
                <option value="__new__">+ Add custom category…</option>
              </select>
              {docForm.category === "__new__" && (
                <input
                  style={{ ...IN, marginTop: 6 }}
                  placeholder="Custom category name"
                  value={docForm.customCategory}
                  onChange={e => setDocForm(f => ({ ...f, customCategory: e.target.value }))}
                  autoFocus
                />
              )}
            </div>

            {/* Folder */}
            <div>
              <label style={LBL}>Folder</label>
              <select style={IN} value={docForm.folderId} onChange={e => setDocForm(f => ({ ...f, folderId: e.target.value }))}>
                <option value="">Root (no folder)</option>
                {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 24 }}>
            <button onClick={() => setDocModal(null)} style={cancelBtn}>Cancel</button>
            <button
              onClick={saveDoc}
              disabled={!docForm.name.trim() || (docForm.type === "link" && !docForm.url.trim())}
              style={saveBtn}
            >
              {docModal === "add" ? "Add" : "Save"}
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* ── Folder modal ─────────────────────────────────────────────────────── */}
      {folderModal && (
        <ModalOverlay onClose={() => setFolderModal(null)}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#1c1c1a", marginBottom: 20 }}>
            {folderModal === "add" ? "New Folder" : "Rename Folder"}
          </div>
          <label style={LBL}>Folder name</label>
          <input
            style={IN}
            value={folderName}
            onChange={e => setFolderName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") saveFolder(); }}
            placeholder="e.g. Insurance Documents"
            autoFocus
          />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
            <button onClick={() => setFolderModal(null)} style={cancelBtn}>Cancel</button>
            <button onClick={saveFolder} disabled={!folderName.trim()} style={saveBtn}>
              {folderModal === "add" ? "Create" : "Rename"}
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* ── Note viewer ──────────────────────────────────────────────────────── */}
      {viewNote && (
        <ModalOverlay onClose={() => setViewNote(null)} wide>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#1c1c1a" }}>{viewNote.name}</div>
              <div style={{ marginTop: 6 }}>
                <CategoryBadge category={viewNote.category} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => { setViewNote(null); openEditDoc(viewNote); }}
                style={{ ...outlineBtn, fontSize: 12, padding: "6px 12px" }}
              >
                <IconPencil size={13} />
                Edit
              </button>
              <button onClick={() => setViewNote(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                <IconX size={18} color="#9e9b93" />
              </button>
            </div>
          </div>
          <div style={{ borderTop: "1px solid #e6e4de", paddingTop: 16 }}>
            <pre style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: 14, color: "#1c1c1a", lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
              {viewNote.content || <span style={{ color: "#9e9b93" }}>No content.</span>}
            </pre>
          </div>
        </ModalOverlay>
      )}

      {/* ── Confirm delete ────────────────────────────────────────────────────── */}
      {confirmDelete && (
        <ModalOverlay onClose={() => setConfirmDelete(null)}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#1c1c1a", marginBottom: 8 }}>
            Delete {confirmDelete.type === "folder" ? "Folder" : "Document"}
          </div>
          <div style={{ fontSize: 13, color: "#6b6960", marginBottom: 20 }}>
            {confirmDelete.type === "folder"
              ? `Delete "${confirmDelete.name}"? Documents inside will be moved to Root.`
              : `Delete "${confirmDelete.name}"? This cannot be undone.`
            }
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => setConfirmDelete(null)} style={cancelBtn}>Cancel</button>
            <button
              onClick={() => {
                if (confirmDelete.type === "doc") removeDocument(confirmDelete.id);
                else removeFolder(confirmDelete.id);
                setConfirmDelete(null);
              }}
              style={{ ...saveBtn, background: "#b93228", borderColor: "#b93228" }}
            >
              Delete
            </button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

// ── Shared card components ────────────────────────────────────────────────────

function FolderCard({
  folder, docCount, folderCount, onClick, onEdit, onDelete,
}: {
  folder: DocFolder;
  docCount: number;
  folderCount: number;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const total = docCount + folderCount;
  return (
    <div
      style={{
        background: "#fff", borderRadius: 12, border: "1px solid #e6e4de",
        padding: "18px 18px 14px", cursor: "pointer", position: "relative",
        display: "flex", flexDirection: "column", gap: 10,
        transition: "box-shadow 0.15s",
      }}
      onClick={onClick}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.07)"}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "none"}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(201,168,76,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IconFolder size={20} color="#7a5e10" strokeWidth={1.75} />
        </div>
        <div style={{ display: "flex", gap: 4 }} onClick={e => e.stopPropagation()}>
          <ActionBtn icon={<IconPencil size={13} />} onClick={onEdit} />
          <ActionBtn icon={<IconTrash size={13} />} onClick={onDelete} danger />
        </div>
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#1c1c1a", lineHeight: 1.3 }}>{folder.name}</div>
        <div style={{ fontSize: 11, color: "#9e9b93", marginTop: 4 }}>
          {total === 0 ? "Empty" : `${total} item${total !== 1 ? "s" : ""}`}
        </div>
      </div>
    </div>
  );
}

function DocCard({
  doc, folders, showPath = false, onOpen, onEdit, onDelete,
}: {
  doc: Document;
  folders: DocFolder[];
  showPath?: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isLink = doc.type === "link";
  const iconBg = isLink ? "rgba(59,158,149,0.12)" : "rgba(155,111,163,0.12)";
  const iconColor = isLink ? "#16645d" : "#5a3460";

  return (
    <div
      style={{
        background: "#fff", borderRadius: 12, border: "1px solid #e6e4de",
        padding: "18px 18px 14px", cursor: "pointer", position: "relative",
        display: "flex", flexDirection: "column", gap: 10,
        transition: "box-shadow 0.15s",
      }}
      onClick={onOpen}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.07)"}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "none"}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {isLink ? <IconLink size={18} color={iconColor} strokeWidth={1.75} /> : <IconNotes size={18} color={iconColor} strokeWidth={1.75} />}
        </div>
        <div style={{ display: "flex", gap: 4 }} onClick={e => e.stopPropagation()}>
          {isLink && (
            <ActionBtn icon={<IconExternalLink size={13} />} onClick={() => window.open(doc.url, "_blank")} />
          )}
          {!isLink && (
            <ActionBtn icon={<IconEye size={13} />} onClick={onOpen} />
          )}
          <ActionBtn icon={<IconPencil size={13} />} onClick={onEdit} />
          <ActionBtn icon={<IconTrash size={13} />} onClick={onDelete} danger />
        </div>
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#1c1c1a", lineHeight: 1.3, marginBottom: 6 }}>{doc.name}</div>
        <CategoryBadge category={doc.category} />
        {showPath && (
          <div style={{ fontSize: 10, color: "#9e9b93", marginTop: 6 }}>{getDocPath(doc, folders)}</div>
        )}
        {isLink && doc.url && (
          <div style={{ fontSize: 11, color: "#9e9b93", marginTop: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {doc.url}
          </div>
        )}
        {!isLink && doc.content && (
          <div style={{ fontSize: 11, color: "#9e9b93", marginTop: 6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {doc.content}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 12 }}>
      {icon}
      <div style={{ fontSize: 13, color: "#9e9b93" }}>{text}</div>
    </div>
  );
}

function ActionBtn({ icon, onClick, danger }: { icon: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 26, height: 26, borderRadius: 6, border: "none", cursor: "pointer",
        background: "transparent", color: danger ? "#b93228" : "#6b6960",
        transition: "background 0.12s",
      }}
      onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = danger ? "rgba(185,50,40,0.08)" : "#f0ede8"}
      onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}
    >
      {icon}
    </button>
  );
}

function ModalOverlay({ children, onClose, wide }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: wide ? 620 : 460, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 40px rgba(0,0,0,0.15)" }}>
        {children}
      </div>
    </div>
  );
}

// ── Button styles ─────────────────────────────────────────────────────────────

const primaryBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 6,
  padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500,
  background: "#3b9e95", color: "#fff", border: "1.5px solid #3b9e95",
  cursor: "pointer",
};
const outlineBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 6,
  padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500,
  background: "#fff", color: "#1c1c1a", border: "1.5px solid #e4e2dc",
  cursor: "pointer",
};
const cancelBtn: React.CSSProperties = {
  padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 500,
  background: "#f0ede8", color: "#6b6960", border: "1.5px solid #e4e2dc",
  cursor: "pointer",
};
const saveBtn: React.CSSProperties = {
  padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 500,
  background: "#3b9e95", color: "#fff", border: "1.5px solid #3b9e95",
  cursor: "pointer",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
  gap: 16,
};
