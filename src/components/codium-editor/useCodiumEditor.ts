import { useContext } from 'react'
import { CodiumEditorContext } from './CodiumEditorContext'

export function useCodiumEditor() {
  const ctx = useContext(CodiumEditorContext)
  if (!ctx) throw new Error('useCodiumEditor must be used within CodiumEditorProvider')
  return ctx
}
