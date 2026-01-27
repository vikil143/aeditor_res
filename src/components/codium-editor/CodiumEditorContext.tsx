import React, { createContext, useCallback, useMemo, useState } from 'react'
import { Document, Language } from '@codeium/react-code-editor'

export type Doc = {
  id: string
  title: string
  language: string
  content: string
}

export type CodiumEditorContextValue = {
  docs: Doc[]
  activeDocId: string
  activeDoc: Doc | undefined
  otherDocuments: Document[]
  setActiveDocId: (id: string) => void
  updateDocContent: (id: string, content: string) => void
  addDoc: (doc?: Partial<Doc>) => void
  removeDoc: (id: string) => void
}

export const CodiumEditorContext = createContext<CodiumEditorContextValue | null>(null)

const createId = () => `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

const resolveLanguage = (language: string) => {
  switch (language) {
    case 'typescript':
      return Language.TYPESCRIPT
    case 'javascript':
      return Language.JAVASCRIPT
    case 'html':
      return Language.HTML
    case 'css':
      return Language.CSS
    case 'json':
      return Language.JSON
    default:
      return Language.UNSPECIFIED
  }
}

export const resolvePath = (title: string) => `/app/${title}`

const seedDocs: Doc[] = [
  {
    id: 'doc_main',
    title: 'main.ts',
    language: 'typescript',
    content: `export const greet = (name: string) => {\n  return \`Hello, \${name}!\`\n}\n`,
  },
  {
    id: 'doc_utils',
    title: 'utils.ts',
    language: 'typescript',
    content: `export const sum = (a: number, b: number) => a + b\n`,
  },
]

export function CodiumEditorProvider({ children }: { children: React.ReactNode }) {
  const [docs, setDocs] = useState<Doc[]>(seedDocs)
  const [activeDocId, setActiveDocId] = useState<string>(seedDocs[0]?.id ?? '')

  const updateDocContent = useCallback((id: string, content: string) => {
    setDocs((prev) => prev.map((doc) => (doc.id === id ? { ...doc, content } : doc)))
  }, [])

  const addDoc = useCallback(
    (partial?: Partial<Doc>) => {
      const id = partial?.id ?? createId()
      const newDoc: Doc = {
        id,
        title: partial?.title ?? `untitled-${docs.length + 1}.ts`,
        language: partial?.language ?? 'typescript',
        content: partial?.content ?? '',
      }
      setDocs((prev) => [...prev, newDoc])
      setActiveDocId(id)
    },
    [docs.length],
  )

  const removeDoc = useCallback((id: string) => {
    setDocs((prev) => {
      const next = prev.filter((doc) => doc.id !== id)
      setActiveDocId((prevActive) => {
        if (prevActive !== id) return prevActive
        return next[0]?.id ?? ''
      })
      return next
    })
  }, [])

  const activeDoc = useMemo(() => docs.find((doc) => doc.id === activeDocId), [docs, activeDocId])

  const otherDocuments = useMemo(() => {
    return docs
      .filter((doc) => doc.id !== activeDocId)
      .map(
        (doc) =>
          new Document({
            absolutePath: resolvePath(doc.title),
            relativePath: doc.title,
            text: doc.content,
            editorLanguage: doc.language,
            language: resolveLanguage(doc.language),
          }),
      )
  }, [docs, activeDocId])

  const value = useMemo<CodiumEditorContextValue>(
    () => ({
      docs,
      activeDocId,
      activeDoc,
      otherDocuments,
      setActiveDocId,
      updateDocContent,
      addDoc,
      removeDoc,
    }),
    [docs, activeDocId, activeDoc, otherDocuments, updateDocContent, addDoc, removeDoc],
  )

  return <CodiumEditorContext.Provider value={value}>{children}</CodiumEditorContext.Provider>
}
