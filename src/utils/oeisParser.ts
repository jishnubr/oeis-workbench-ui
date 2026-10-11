export function parseRawTextToDraft(text: string) {
  // If the user pasted JSON directly:
  const trimmed = text.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsedJson = JSON.parse(trimmed);
      return parsedJson;
    } catch (e) {
      console.warn('JSON parsing failed, falling back to raw text parsing');
    }
  }

  // If the user pasted the OEIS Raw Directives (%I, %N, etc.):
  const draft: any = { pipeline_status: 'Drafting', priority_order: 1 };
  const lines = trimmed.split('\n');

  let currentField = '';
  let currentValue = '';

  const saveField = () => {
    if (!currentField || !currentValue.trim()) return;
    const val = currentValue.trim();
    switch (currentField) {
      case '%I':
        if (/^A\d{6}$/i.test(val)) {
          draft.a_number = val.toUpperCase();
        } else {
          draft.internal_id = val;
        }
        break;
      case '%N': draft.title = val; break;
      case '%S': draft.terms = draft.terms ? draft.terms + ', ' + val : val; break;
      case '%T': draft.terms = draft.terms ? draft.terms + ', ' + val : val; break;
      case '%U': draft.terms = draft.terms ? draft.terms + ', ' + val : val; break;
      case '%O': draft.offset = val; break;
      case '%F': draft.formula = val; break;
      case '%D': draft.references_doc = draft.references_doc ? draft.references_doc + '\n' + val : val; break;
      case '%H': draft.links = draft.links ? draft.links + '\n' + val : val; break;
      case '%e': draft.examples = val; break;
      case '%p': draft.maple_code = val; break;
      case '%t': draft.mathematica_code = val; break;
      case '%o':
        if (val.startsWith('(PARI)')) {
          const codeOnly = val.replace(/^\(PARI\)\s*/, '');
          draft.pari_code = draft.pari_code ? draft.pari_code + '\n' + codeOnly : codeOnly;
        } else {
          draft.program_code = draft.program_code ? draft.program_code + '\n' + val : val;
        }
        break;
      case '%Y': draft.crossrefs = val; break;
      case '%K': draft.keywords = val; break;
      case '%A': draft.author = val; break;
      case '%E': draft.extensions = val; break;
      case '%C': draft.comments = draft.comments ? draft.comments + '\n' + val : val; break;
    }
  };

  for (const line of lines) {
    if (line.match(/^%[a-zA-Z]/)) {
      saveField();
      currentField = line.substring(0, 2);
      currentValue = line.substring(2).trim();
    } else {
      currentValue += '\n' + line;
    }
  }
  saveField();

  if (!draft.internal_id) {
    draft.internal_id = `JIS-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  }

  return draft;
}
