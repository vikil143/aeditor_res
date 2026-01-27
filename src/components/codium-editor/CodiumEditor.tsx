import { CodeiumEditor } from '@codeium/react-code-editor'
import { resolvePath } from './CodiumEditorContext'
import { useCodiumEditor } from './useCodiumEditor'

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
