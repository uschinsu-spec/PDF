// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFile } from 'node:fs/promises';
import {
  createEngine,
  loadEditCore,
  modelOf,
  paragraphText,
  allText,
  runsFrom,
  type Engine,
} from './helpers/editcore-harness';
import { twoParagraphPdf, A_TEXT, B_TEXT } from './helpers/editcore-fixtures';

describe('vendored editcore engine', () => {
  async function unicodeTestFont(): Promise<Uint8Array> {
    const candidates = [
      '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
      '/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf',
      '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    ];
    for (const path of candidates) {
      try {
        return new Uint8Array(await readFile(path));
      } catch {
        // Try the next font installed by the test runner.
      }
    }
    throw new Error('Regression test requires an installed Unicode TTF font');
  }
  let engine: Engine;

  beforeAll(async () => {
    engine = await createEngine();
  });

  afterAll(() => {
    engine.close();
  });

  it('loads the vendored wasm and builds a page model', () => {
    const model = modelOf(engine, twoParagraphPdf());
    expect(model).toHaveLength(2);
    expect(paragraphText(model[0])).toBe(A_TEXT);
    expect(paragraphText(model[1])).toBe(B_TEXT);
  });

  it('reports paragraphs as editable', () => {
    for (const p of modelOf(engine, twoParagraphPdf())) {
      expect(p.editable).toBe(true);
      expect(p.lockReason).toBe(0);
    }
  });

  it('commits an edit into the page model', () => {
    const model = modelOf(engine, twoParagraphPdf());
    const target = model[0];
    engine.commitParagraph(
      target.id,
      runsFrom(target, paragraphText(target).replace('quick', 'quicks')),
      target.format
    );
    const after = engine.buildModel();
    expect(paragraphText(after[0])).toBe(A_TEXT.replace('quick', 'quicks'));
    expect(paragraphText(after[1])).toBe(B_TEXT);
  });

  it('splices an edit back into a re-openable document', async () => {
    const model = modelOf(engine, twoParagraphPdf());
    const target = model[0];
    engine.commitParagraph(
      target.id,
      runsFrom(target, paragraphText(target).replace('quick', 'quicks')),
      target.format
    );

    const saved = await engine.saveSpliced();
    expect(saved).toBeTruthy();
    expect(saved!.length).toBeGreaterThan(0);
    expect(new TextDecoder().decode(saved!.subarray(0, 5))).toBe('%PDF-');

    const text = allText(modelOf(engine, saved!));
    expect(text).toContain('The quicks brown fox');
    expect(text).toContain(B_TEXT);
  });

  it('round-trips Vietnamese edits and character deletions through save/reopen', async () => {
    const mod = await loadEditCore();
    const fontBytes = await unicodeTestFont();
    const fontRegistry = (
      mod.PdfEngine as unknown as {
        fallbackFonts: Map<string, Uint8Array>;
      }
    ).fallbackFonts;
    fontRegistry.set('regression-vietnamese', fontBytes);

    try {
      const model = modelOf(engine, twoParagraphPdf());
      const target = model[0];
      const vietnamese =
        'Tiếng Việt có dấu: ă â ê ô ơ ư đ ắ ằ ặ ễ ệ ộ ợ ứ ừ ự';
      engine.commitParagraph(
        target.id,
        runsFrom(target, vietnamese),
        target.format
      );

      const firstSave = await engine.saveSpliced();
      expect(firstSave).toBeTruthy();
      const reopened = modelOf(engine, firstSave!);
      expect(paragraphText(reopened[0])).toBe(vietnamese);

      const editedAfterDelete = vietnamese.replace(' ắ ằ ặ', '');
      engine.commitParagraph(
        reopened[0].id,
        runsFrom(reopened[0], editedAfterDelete),
        reopened[0].format
      );
      const secondSave = await engine.saveSpliced();
      expect(secondSave).toBeTruthy();
      const reopenedAfterDelete = modelOf(engine, secondSave!);
      expect(paragraphText(reopenedAfterDelete[0])).toBe(editedAfterDelete);
      expect(paragraphText(reopenedAfterDelete[0])).not.toContain('ắ ằ ặ');
      expect(paragraphText(reopenedAfterDelete[1])).toBe(B_TEXT);
    } finally {
      fontRegistry.delete('regression-vietnamese');
    }
  });

  it('splices a deletion back into the document', async () => {
    const model = modelOf(engine, twoParagraphPdf());
    engine.deleteParagraph(model[0].id);
    const saved = await engine.saveSpliced();
    expect(saved).toBeTruthy();

    const text = allText(modelOf(engine, saved!));
    expect(text).toContain(B_TEXT);
    expect(text).not.toContain('The quick brown fox');
  });
});
