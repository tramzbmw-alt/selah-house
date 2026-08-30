"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

export type DocType = "link" | "note";

export type Document = {
  id: string;
  name: string;
  category: string;
  type: DocType;
  url?: string;
  content?: string;
  folderId?: string;
  createdAt: string;
};

export type DocFolder = {
  id: string;
  name: string;
  parentId?: string;
  createdAt: string;
};

export const DEFAULT_DOC_CATEGORIES: string[] = [
  "Legal", "Insurance", "Warranties", "Utilities", "Contracts", "Reference", "Other",
];

function mapDoc(r: any): Document {
  return {
    id:        r.id,
    name:      r.name,
    category:  r.category,
    type:      r.type,
    url:       r.url ?? undefined,
    content:   r.content ?? undefined,
    folderId:  r.folder_id ?? undefined,
    createdAt: r.created_at,
  };
}

function mapFolder(r: any): DocFolder {
  return {
    id:        r.id,
    name:      r.name,
    parentId:  r.parent_id ?? undefined,
    createdAt: r.created_at,
  };
}

type DocumentsCtx = {
  documents:        Document[];
  folders:          DocFolder[];
  customCategories: string[];
  loading:          boolean;
  addDocument:      (data: Omit<Document, "id" | "createdAt">) => void;
  updateDocument:   (id: string, data: Partial<Omit<Document, "id" | "createdAt">>) => void;
  removeDocument:   (id: string) => void;
  addFolder:        (data: Omit<DocFolder, "id" | "createdAt">) => void;
  updateFolder:     (id: string, data: Partial<Omit<DocFolder, "id" | "createdAt">>) => void;
  removeFolder:     (id: string) => void;
  addCategory:      (name: string) => void;
  removeCategory:   (name: string) => void;
};

const Ctx = createContext<DocumentsCtx | null>(null);

export function DocumentsProvider({ children }: { children: ReactNode }) {
  const [documents,        setDocuments]        = useState<Document[]>([]);
  const [folders,          setFolders]          = useState<DocFolder[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [loading,          setLoading]          = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("documents").select("*").order("created_at"),
      supabase.from("document_folders").select("*").order("name"),
      supabase.from("document_categories").select("name"),
    ]).then(([{ data: docs }, { data: fols }, { data: cats }]) => {
      if (docs) setDocuments(docs.map(mapDoc));
      if (fols) setFolders(fols.map(mapFolder));
      if (cats) setCustomCategories(cats.map((c: any) => c.name));
      setLoading(false);
    });
  }, []);

  function addDocument(data: Omit<Document, "id" | "createdAt">) {
    supabase.from("documents").insert({
      name:      data.name,
      category:  data.category,
      type:      data.type,
      url:       data.url ?? null,
      content:   data.content ?? null,
      folder_id: data.folderId ?? null,
    }).select().single()
      .then(({ data: row, error }) => {
        if (error) { console.error(error); return; }
        if (row) setDocuments(prev => [...prev, mapDoc(row)]);
      });
  }

  function updateDocument(id: string, data: Partial<Omit<Document, "id" | "createdAt">>) {
    const updates: any = {};
    if (data.name      !== undefined) updates.name      = data.name;
    if (data.category  !== undefined) updates.category  = data.category;
    if (data.type      !== undefined) updates.type      = data.type;
    if (data.url       !== undefined) updates.url       = data.url ?? null;
    if (data.content   !== undefined) updates.content   = data.content ?? null;
    if ("folderId" in data)           updates.folder_id = data.folderId ?? null;

    supabase.from("documents").update(updates).eq("id", id).select().single()
      .then(({ data: row, error }) => {
        if (error) { console.error(error); return; }
        if (row) setDocuments(prev => prev.map(d => d.id === id ? mapDoc(row) : d));
      });
  }

  function removeDocument(id: string) {
    supabase.from("documents").delete().eq("id", id)
      .then(({ error }) => {
        if (error) { console.error(error); return; }
        setDocuments(prev => prev.filter(d => d.id !== id));
      });
  }

  function addFolder(data: Omit<DocFolder, "id" | "createdAt">) {
    supabase.from("document_folders").insert({
      name:      data.name,
      parent_id: data.parentId ?? null,
    }).select().single()
      .then(({ data: row, error }) => {
        if (error) { console.error(error); return; }
        if (row) setFolders(prev => [...prev, mapFolder(row)]);
      });
  }

  function updateFolder(id: string, data: Partial<Omit<DocFolder, "id" | "createdAt">>) {
    const updates: any = {};
    if (data.name     !== undefined) updates.name      = data.name;
    if ("parentId" in data)          updates.parent_id = data.parentId ?? null;

    supabase.from("document_folders").update(updates).eq("id", id).select().single()
      .then(({ data: row, error }) => {
        if (error) { console.error(error); return; }
        if (row) setFolders(prev => prev.map(f => f.id === id ? mapFolder(row) : f));
      });
  }

  function removeFolder(id: string) {
    supabase.from("document_folders").delete().eq("id", id)
      .then(({ error }) => {
        if (error) { console.error(error); return; }
        setFolders(prev => prev.filter(f => f.id !== id));
        // Documents with this folder_id will have folder_id set to null by the DB (ON DELETE SET NULL)
        setDocuments(prev => prev.map(d => d.folderId === id ? { ...d, folderId: undefined } : d));
      });
  }

  function addCategory(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (customCategories.includes(trimmed) || DEFAULT_DOC_CATEGORIES.includes(trimmed)) return;
    supabase.from("document_categories").insert({ name: trimmed })
      .then(({ error }) => {
        if (error) { console.error(error); return; }
        setCustomCategories(prev => [...prev, trimmed]);
      });
  }

  function removeCategory(name: string) {
    supabase.from("document_categories").delete().eq("name", name)
      .then(({ error }) => {
        if (error) { console.error(error); return; }
        setCustomCategories(prev => prev.filter(c => c !== name));
      });
  }

  return (
    <Ctx.Provider value={{
      documents, folders, customCategories, loading,
      addDocument, updateDocument, removeDocument,
      addFolder, updateFolder, removeFolder,
      addCategory, removeCategory,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useDocuments() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDocuments must be used inside DocumentsProvider");
  return ctx;
}
