import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { CodeiumEditor, Document, Language } from '@codeium/react-code-editor'

type Doc = {
  id: string
  title: string
  language: string
  content: string
}

type CodiumEditorContextValue = {
  docs: Doc[]
  activeDocId: string
  activeDoc: Doc | undefined
  otherDocuments: Document[]
  setActiveDocId: (id: string) => void
  updateDocContent: (id: string, content: string) => void
  addDoc: (doc?: Partial<Doc>) => void
  removeDoc: (id: string) => void
}

const CodiumEditorContext = createContext<CodiumEditorContextValue | null>(null)

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
const resolvePath = (title: string) => `/app/${title}`

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

  const addDoc = useCallback((partial?: Partial<Doc>) => {
    const id = partial?.id ?? createId()
    const newDoc: Doc = {
      id,
      title: partial?.title ?? `untitled-${docs.length + 1}.ts`,
      language: partial?.language ?? 'typescript',
      content: partial?.content ?? '',
    }
    setDocs((prev) => [...prev, newDoc])
    setActiveDocId(id)
  }, [docs.length])

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
          })
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
    [docs, activeDocId, activeDoc, otherDocuments, updateDocContent, addDoc, removeDoc]
  )

  return <CodiumEditorContext.Provider value={value}>{children}</CodiumEditorContext.Provider>
}

export function useCodiumEditor() {
  const ctx = useContext(CodiumEditorContext)
  if (!ctx) throw new Error('useCodiumEditor must be used within CodiumEditorProvider')
  return ctx
}

export default function CodiumEditor() {
  const {
    docs,
    activeDocId,
    activeDoc,
    otherDocuments,
    setActiveDocId,
    updateDocContent,
    addDoc,
    removeDoc,
  } = useCodiumEditor()

  return (
    <div className="codium-editor">
      <div className="codium-editor__tabs" role="tablist" aria-label="Open documents">
        {docs.map((doc) => (
          <button
            key={doc.id}
            type="button"
            role="tab"
            aria-selected={doc.id === activeDocId}
            className={doc.id === activeDocId ? 'codium-editor__tab is-active' : 'codium-editor__tab'}
            onClick={() => setActiveDocId(doc.id)}
          >
            <span className="codium-editor__tab-title">{doc.title}</span>
            <span className="codium-editor__tab-lang">{doc.language}</span>
            <span
              role="button"
              aria-label={`Close ${doc.title}`}
              className="codium-editor__tab-close"
              onClick={(event) => {
                event.stopPropagation()
                removeDoc(doc.id)
              }}
            >
              ×
            </span>
          </button>
        ))}
        <button type="button" className="codium-editor__tab-add" onClick={() => addDoc()}>
          + New
        </button>
      </div>

      <div className="codium-editor__workspace">
        <div className="codium-editor__sidebar">
          <div className="codium-editor__section-title">Documents</div>
          {docs.map((doc) => (
            <button
              key={doc.id}
              type="button"
              className={doc.id === activeDocId ? 'codium-editor__doc is-active' : 'codium-editor__doc'}
              onClick={() => setActiveDocId(doc.id)}
            >
              {doc.title}
            </button>
          ))}
        </div>

        <div className="codium-editor__main">
          <div className="codium-editor__toolbar">
            <div className="codium-editor__file-info">
              {activeDoc ? `${activeDoc.title} (${activeDoc.language})` : 'No document selected'}
            </div>
          </div>

          <div className="codium-editor__editor" role="tabpanel">
            {activeDoc ? (
              <CodeiumEditor
                language={activeDoc.language}
                theme="vs-dark"
                value={activeDoc.content}
                path={resolvePath(activeDoc.title)}
                otherDocuments={otherDocuments}
                containerClassName="codium-editor__monaco"
                height="100%"
                width="100%"
                onChange={(value) => updateDocContent(activeDoc.id, value ?? '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: '"JetBrains Mono", "SFMono-Regular", "Menlo", monospace',
                }}
              />
            ) : (
              <div className="codium-editor__empty">Create a document to start editing.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
