import CodiumEditor, { CodiumEditorProvider } from './components/codium-editor/CodiumEditor'

function App() {
  return (
    <CodiumEditorProvider>
      <CodiumEditor />
    </CodiumEditorProvider>
  )
}

export default App