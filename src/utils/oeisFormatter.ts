export function oeisFormatter(draft: any) {
  let output = `%I ${draft.a_number ? draft.a_number : draft.internal_id}\n`;

  if (draft.title) {
    output += `%N ${draft.title}\n`;
  }

  if (draft.terms) {
    const termLines = chunkString(draft.terms, 70);
    const prefixes = ['%S', '%T', '%U'];
    termLines.forEach((line, idx) => {
      if (idx < 3) {
        output += `${prefixes[idx]} ${line}\n`;
      }
    });
  }

  if (draft.comments) {
    try {
      const comments = typeof draft.comments === 'string' ? JSON.parse(draft.comments) : draft.comments;
      if (Array.isArray(comments)) {
        comments.forEach((c: string) => {
          output += `%C ${c}\n`;
        });
      } else {
        output += `%C ${draft.comments}\n`;
      }
    } catch (e) {
      output += `%C ${draft.comments.split('\n').join('\n%C ')}\n`;
    }
  }

  if (draft.references_doc) output += `%D ${draft.references_doc.split('\n').join('\n%D ')}\n`;
  if (draft.links) output += `%H ${draft.links.split('\n').join('\n%H ')}\n`;
  if (draft.formula) output += `%F ${draft.formula.split('\n').join('\n%F ')}\n`;
  if (draft.examples) output += `%e ${draft.examples.split('\n').join('\n%e ')}\n`;
  if (draft.maple_code) output += `%p ${draft.maple_code.split('\n').join('\n%p ')}\n`;
  if (draft.mathematica_code) output += `%t ${draft.mathematica_code.split('\n').join('\n%t ')}\n`;
  if (draft.pari_code) output += `%o (PARI) ${draft.pari_code.split('\n').join('\n%o (PARI) ')}\n`;
  if (draft.program_code) output += `%o ${draft.program_code.split('\n').join('\n%o ')}\n`;

  if (draft.crossrefs) {
    let cleanRefs = '';
    try {
      const refs = typeof draft.crossrefs === 'string' ? JSON.parse(draft.crossrefs) : draft.crossrefs;
      if (Array.isArray(refs) && refs.length > 0) {
        cleanRefs = refs.join(', ');
      } else if (typeof draft.crossrefs === 'string') {
        cleanRefs = draft.crossrefs;
      }
    } catch (e) {
      cleanRefs = String(draft.crossrefs || '');
    }

    if (cleanRefs) {
      // Strip any accidental leading "Cf." or "Cf " and trailing periods
      cleanRefs = cleanRefs.trim().replace(/^Cf\.?\s*/i, '').replace(/\.+$/, '').trim();
      if (cleanRefs) {
        output += `%Y Cf. ${cleanRefs}.\n`;
      }
    }
  }

  if (draft.keywords) output += `%K ${draft.keywords}\n`;
  if (draft.offset) output += `%O ${draft.offset}\n`;
  if (draft.author) output += `%A ${draft.author}\n`;
  if (draft.extensions) output += `%E ${draft.extensions}\n`;

  return output.trim();
}

function chunkString(str: string, size: number) {
  const chunks = [];
  let current = '';
  const parts = str.split(/,\s*/);

  for (const part of parts) {
    if ((current + part).length > size) {
      if (current) {
        chunks.push(current.trim().replace(/,$/, ''));
      }
      current = part + ', ';
    } else {
      current += part + ', ';
    }
  }
  if (current) {
    chunks.push(current.trim().replace(/,$/, ''));
  }
  return chunks;
}
