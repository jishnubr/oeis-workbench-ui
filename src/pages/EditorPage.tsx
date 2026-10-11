import { useState } from 'react';
import FieldNavigator from '../components/editor/FieldNavigator';
import EditorForm from '../components/editor/EditorForm';
import RetroPreview from '../components/editor/RetroPreview';
import { saveDraft } from '../api/drafts';
import ResizeHandle from '../components/common/ResizeHandle';
import { useResizablePanel } from '../hooks/useResizablePanel';

interface EditorPageProps {
  draft: any | null;
  onClose: () => void;
}

function safeParseField(val: any, delimiter: string = '\n'): string {
  if (!val) return '';
  if (Array.isArray(val)) return val.join(delimiter);
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.join(delimiter);
      } catch { /* fallback */ }
    }
    return val;
  }
  return String(val);
}

export default function EditorPage({ draft, onClose }: EditorPageProps) {
  const [formData, setFormData] = useState({
    internal_id: draft?.internal_id || `JIS-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
    a_number: draft?.a_number || '',
    title: draft?.title || '',
    terms: draft?.terms || '',
    offset: draft?.offset || '',
    formula: draft?.formula || '',
    comments: safeParseField(draft?.comments, '\n'),
    references_doc: draft?.references_doc || '',
    links: draft?.links || '',
    examples: draft?.examples || '',
    maple_code: draft?.maple_code || '',
    mathematica_code: draft?.mathematica_code || '',
    pari_code: draft?.pari_code || '',
    program_code: draft?.program_code || '',
    b_file_content: draft?.b_file_content || '',
    crossrefs: safeParseField(draft?.crossrefs, ', '),
    keywords: draft?.keywords || '',
    author: draft?.author || '',
    extensions: draft?.extensions || '',
    tags: safeParseField(draft?.tags, ', '),
    pipeline_status: draft?.pipeline_status || 'Drafting',
    maintenance_notes: draft?.maintenance_notes || '',
    theorem_latex: draft?.theorem_latex || '',
    proof_latex: draft?.proof_latex || '',
    paper_section: draft?.paper_section || '',
    research_notes: draft?.research_notes || '',
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const payload = {
      ...formData,
      comments: formData.comments.split('\n').filter((c: string) => c.trim()),
      crossrefs: formData.crossrefs,
      tags: formData.tags.split(',').map((c: string) => c.trim()).filter(Boolean),
    };
    await saveDraft(payload);
    setIsSaving(false);
    onClose();
  };

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addKeyword = (kw: string) => {
    const currentKws = formData.keywords ? formData.keywords.split(',').map((k: string) => k.trim()) : [];
    if (!currentKws.includes(kw)) {
      const updated = [...currentKws, kw].filter(Boolean).join(', ');
      setFormData({ ...formData, keywords: updated });
    }
  };

  const preview = useResizablePanel({
    initialWidth: window.innerWidth * 0.45,
    minWidth: 300,
    maxWidth: window.innerWidth * 0.7,
    storageKey: 'workbench_editor_preview_width',
    direction: 'left'
  });

  return (
    <div className="w-full h-full flex overflow-hidden">
      <FieldNavigator
        internalId={formData.internal_id}
        pipelineStatus={formData.pipeline_status}
        onClose={onClose}
      />
      <div className="flex-1 overflow-hidden min-w-0 flex">
        <EditorForm
          formData={formData}
          onChange={handleChange}
          onAddKeyword={addKeyword}
          onSave={handleSave}
          onClose={onClose}
          isSaving={isSaving}
        />
      </div>
      <ResizeHandle 
        onMouseDown={preview.handleMouseDown} 
        isCollapsed={preview.isCollapsed} 
        onToggleCollapse={preview.toggleCollapse} 
        direction="left" 
      />
      {!preview.isCollapsed && (
        <div style={{ width: preview.width }} className="shrink-0 flex h-full">
          <RetroPreview formData={formData} />
        </div>
      )}
    </div>
  );
}
