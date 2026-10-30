import { describe, expect, it } from 'vitest';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { canvasRectToPdfBounds, clampCanvasRect, rasterRegionScaleFactor, rectsIntersect } from '../js/logic/pdf-region-geometry';

describe('PDF region geometry',()=>{
 it('rounds both selection edges before calculating the final dimensions',()=>{
  expect(clampCanvasRect({x:9.7,y:3.2,w:10.2,h:40},10,20)).toEqual({x:9,y:3,w:1,h:17});
 });
 it('converts a normal PDF.js viewport rectangle to PDF points',()=>{
  const bounds=canvasRectToPdfBounds({x:15,y:30,w:30,h:45},[1.5,0,0,-1.5,0,900]);
  expect(bounds.left).toBeCloseTo(10);
  expect(bounds.right).toBeCloseTo(30);
  expect(bounds.bottom).toBeCloseTo(550);
  expect(bounds.top).toBeCloseTo(580);
 });
 it('handles rotated pages and non-zero page-box origins',()=>{
  const bounds=canvasRectToPdfBounds({x:5,y:10,w:20,h:30},[0,2,-2,0,100,0]);
  expect(bounds.left).toBeCloseTo(5);
  expect(bounds.right).toBeCloseTo(20);
  expect(bounds.bottom).toBeCloseTo(37.5);
  expect(bounds.top).toBeCloseTo(47.5);
 });
 it('rejects a non-invertible viewport transform',()=>{
  expect(()=>canvasRectToPdfBounds({x:0,y:0,w:1,h:1},[1,2,2,4,0,0])).toThrow('not invertible');
 });
 it('upscales compact raster fallback captures within a memory budget',()=>{
  expect(rasterRegionScaleFactor({x:0,y:0,w:1000,h:500})).toBeCloseTo(8/3);
 });
 it('keeps very large fallback regions at the preview resolution',()=>{
  expect(rasterRegionScaleFactor({x:0,y:0,w:9000,h:9000})).toBeNull();
 });
 it('detects overlap for deciding when a raster appearance fallback is required',()=>{
  expect(rectsIntersect({x:0,y:0,w:10,h:10},{x:9,y:9,w:5,h:5})).toBe(true);
  expect(rectsIntersect({x:0,y:0,w:10,h:10},{x:10,y:0,w:5,h:5})).toBe(false);
 });
 it('embeds a selected page area as a PDF Form XObject instead of a screenshot',async()=>{
  const sourceDoc=await PDFDocument.create();
  const sourcePage=sourceDoc.addPage([300,200]);
  const font=await sourceDoc.embedFont(StandardFonts.Helvetica);
  sourcePage.drawText('VECTOR REGION',{x:20,y:100,size:16,font});
  const sourceBytes=await sourceDoc.save();
  const source=await PDFDocument.load(sourceBytes);

  const output=await PDFDocument.create();
  const target=output.addPage([300,200]);
  const bounds={left:10,right:180,bottom:70,top:140};
  const form=await output.embedPage(source.getPage(0),bounds);

  expect(form.width).toBeCloseTo(170);
  expect(form.height).toBeCloseTo(70);
  target.drawPage(form,{x:60,y:40,width:170,height:70});
  const saved=await output.save({useObjectStreams:false});
  expect(new TextDecoder().decode(saved)).toContain('/Subtype /Form');
  expect((await PDFDocument.load(saved)).getPageCount()).toBe(1);
 });
});
