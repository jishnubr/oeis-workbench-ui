import { Play } from 'lucide-react';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

const FIELD_LABELS: Record<string, string> = {
  '%N': 'Name / Title',
  '%S': 'Sequence Terms',
  '%C': 'Comments',
  '%F': 'Formula',
  '%O': 'Offset',
  '%D': 'References',
  '%H': 'Links',
  '%e': 'Examples',
  '%p': 'Maple Program',
  '%t': 'Mathematica Program',
  '%o (PARI)': 'PARI/GP Program',
  '%o': 'Other Programs',
  '%Y': 'Cross-references',
  '%K': 'Keywords',
  '%A': 'Author',
  '%E': 'Extensions / Errata',
  'B-File': 'B-File Data',
};

function FieldTag({ tag }: { tag: string }) {
  return (
    <div className="flex flex-col items-start gap-0.5 pt-1 pr-4 min-w-[7rem]">
      <span className="text-[10px] font-mono text-neutral-500 leading-none">{tag}</span>
      <span className="text-xs font-semibold text-neutral-400 leading-tight whitespace-nowrap">
        {FIELD_LABELS[tag] ?? tag}
      </span>
    </div>
  );
}

export default function RetroPreview({ formData }: { formData: any }) {
  return (
    <div className="w-full h-full shrink-0 flex flex-col bg-[#F4F4F4] text-neutral-900 border-l border-neutral-300">
      <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-white shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-2">
          <Play className="w-4 h-4 text-green-600 fill-current" />
          <span className="font-semibold text-sm text-neutral-700">Live Retro Preview</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 oeis-retro">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="border border-[#CCCCCC] p-4 bg-white shadow-sm">
            <div className="oeis-retro-header mb-4 text-lg">
              Greetings from the On-Line Encyclopedia of Integer Sequences!
            </div>
            <div className="text-xl font-bold mb-4 font-sans text-blue-800 flex items-center justify-between">
              <span>{formData.a_number ? `${formData.a_number} (${formData.internal_id})` : `Draft: ${formData.internal_id}`}</span>
              {formData.a_number && <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">OEIS Official</span>}
            </div>

            <table className="w-full text-sm">
              <tbody>
                {formData.title && (
                  <tr className="align-top border-t border-[#E8E8E8]">
                    <td className="pb-3 pt-3 pr-4"><FieldTag tag="%N" /></td>
                    <td className="pb-3 pt-3 text-lg font-bold">{formData.title}</td>
                  </tr>
                )}
                {formData.terms && (
                  <tr className="align-top border-t border-[#E8E8E8]">
                    <td className="pb-3 pt-3 pr-4"><FieldTag tag="%S" /></td>
                    <td className="pb-3 pt-3">
                      <div className="font-mono bg-white p-2 border border-[#CCCCCC] whitespace-pre-wrap text-xs break-all">{formData.terms}</div>
                    </td>
                  </tr>
                )}
                {formData.offset && (
                  <tr className="align-top border-t border-[#E8E8E8]">
                    <td className="pb-3 pt-3 pr-4"><FieldTag tag="%O" /></td>
                    <td className="pb-3 pt-3 text-sm">{formData.offset}</td>
                  </tr>
                )}
                {formData.comments && (
                  <tr className="align-top border-t border-[#E8E8E8]">
                    <td className="pb-3 pt-3 pr-4"><FieldTag tag="%C" /></td>
                    <td className="pb-3 pt-3">
                      <div className="space-y-1.5 text-xs">
                        {formData.comments.split('\n').map((c: string, i: number) => (
                          <p key={i} className="mb-0">{c}</p>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
                {formData.references_doc && (
                  <tr className="align-top border-t border-[#E8E8E8]">
                    <td className="pb-3 pt-3 pr-4"><FieldTag tag="%D" /></td>
                    <td className="pb-3 pt-3 text-xs whitespace-pre-wrap">{formData.references_doc}</td>
                  </tr>
                )}
                {formData.links && (
                  <tr className="align-top border-t border-[#E8E8E8]">
                    <td className="pb-3 pt-3 pr-4"><FieldTag tag="%H" /></td>
                    <td className="pb-3 pt-3 text-xs whitespace-pre-wrap text-blue-700 underline">{formData.links}</td>
                  </tr>
                )}
                {formData.formula && (
                  <tr className="align-top border-t border-[#E8E8E8]">
                    <td className="pb-3 pt-3 pr-4"><FieldTag tag="%F" /></td>
                    <td className="pb-3 pt-3">
                      <div className="space-y-1.5 text-xs font-mono bg-white p-2 border border-[#CCCCCC]">
                        {formData.formula.split('\n').map((f: string, i: number) => {
                          const isLatex = f.includes('\\') || f.includes('~') || f.includes('^') || f.includes('_');
                          return (
                            <div key={i} className="mb-0 whitespace-pre-wrap break-all">
                              <div>{f}</div>
                              {isLatex && (
                                <div className="mt-1 pt-1 border-t border-[#E8E8E8] text-neutral-800 text-sm overflow-x-auto">
                                  <InlineMath math={f.replace(/^a\(n\)\s*~?\s*/, '').trim()} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                )}
                {formData.examples && (
                  <tr className="align-top border-t border-[#E8E8E8]">
                    <td className="pb-3 pt-3 pr-4"><FieldTag tag="%e" /></td>
                    <td className="pb-3 pt-3 text-xs font-mono whitespace-pre-wrap bg-white p-2 border border-[#CCCCCC] break-all">{formData.examples}</td>
                  </tr>
                )}
                {formData.maple_code && (
                  <tr className="align-top border-t border-[#E8E8E8]">
                    <td className="pb-3 pt-3 pr-4"><FieldTag tag="%p" /></td>
                    <td className="pb-3 pt-3">
                      <pre className="bg-[#E8E8E8] p-2 border border-[#CCCCCC] overflow-x-auto text-[10px]">{formData.maple_code}</pre>
                    </td>
                  </tr>
                )}
                {formData.mathematica_code && (
                  <tr className="align-top border-t border-[#E8E8E8]">
                    <td className="pb-3 pt-3 pr-4"><FieldTag tag="%t" /></td>
                    <td className="pb-3 pt-3">
                      <pre className="bg-[#E8E8E8] p-2 border border-[#CCCCCC] overflow-x-auto text-[10px]">{formData.mathematica_code}</pre>
                    </td>
                  </tr>
                )}
                {formData.pari_code && (
                  <tr className="align-top border-t border-[#E8E8E8]">
                    <td className="pb-3 pt-3 pr-4"><FieldTag tag="%o (PARI)" /></td>
                    <td className="pb-3 pt-3">
                      <pre className="bg-[#E8E8E8] p-2 border border-[#CCCCCC] overflow-x-auto text-[10px]">{formData.pari_code}</pre>
                    </td>
                  </tr>
                )}
                {formData.program_code && (
                  <tr className="align-top border-t border-[#E8E8E8]">
                    <td className="pb-3 pt-3 pr-4"><FieldTag tag="%o" /></td>
                    <td className="pb-3 pt-3">
                      <pre className="bg-[#E8E8E8] p-2 border border-[#CCCCCC] overflow-x-auto text-[10px]">{formData.program_code}</pre>
                    </td>
                  </tr>
                )}
                {formData.crossrefs && (
                  <tr className="align-top border-t border-[#E8E8E8]">
                    <td className="pb-3 pt-3 pr-4"><FieldTag tag="%Y" /></td>
                    <td className="pb-3 pt-3 italic text-xs">
                      {formData.crossrefs.startsWith('Cf.') ? formData.crossrefs : `Cf. ${formData.crossrefs}`}
                    </td>
                  </tr>
                )}
                {formData.keywords && (
                  <tr className="align-top border-t border-[#E8E8E8]">
                    <td className="pb-3 pt-3 pr-4"><FieldTag tag="%K" /></td>
                    <td className="pb-3 pt-3 text-xs">{formData.keywords}</td>
                  </tr>
                )}
                {formData.author && (
                  <tr className="align-top border-t border-[#E8E8E8]">
                    <td className="pb-3 pt-3 pr-4"><FieldTag tag="%A" /></td>
                    <td className="pb-3 pt-3 text-xs">{formData.author}</td>
                  </tr>
                )}
                {formData.extensions && (
                  <tr className="align-top border-t border-[#E8E8E8]">
                    <td className="pb-3 pt-3 pr-4"><FieldTag tag="%E" /></td>
                    <td className="pb-3 pt-3 text-xs">{formData.extensions}</td>
                  </tr>
                )}
                {formData.b_file_content && (
                  <tr className="align-top border-t border-[#E8E8E8]">
                    <td className="pb-3 pt-3 pr-4"><FieldTag tag="B-File" /></td>
                    <td className="pb-3 pt-3 text-[10px] font-mono text-neutral-600">
                      {formData.b_file_content.trim().split('\n').filter(Boolean).length} lines of b-file data provided
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="mt-6 text-[10px] text-neutral-500 text-center border-t border-[#CCCCCC] pt-3 font-sans">
              OEIS Sequence Workbench — Local Draft Preview
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
