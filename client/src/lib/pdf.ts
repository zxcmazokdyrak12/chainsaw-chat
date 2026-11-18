// The smallest useful PDF writer: one JPEG per A4 page, no library.
// JPEG bytes go straight into the file (DCTDecode), so the pages stay sharp and the file small.

const A4 = { w: 595.28, h: 841.89 } // points

export async function jpegPagesToPdf(pages: { jpeg: Blob; width: number; height: number }[]): Promise<Blob> {
  const enc = new TextEncoder()
  const chunks: Uint8Array[] = []
  const offsets: number[] = []
  let size = 0
  const push = (part: string | Uint8Array) => {
    const bytes = typeof part === 'string' ? enc.encode(part) : part
    chunks.push(bytes)
    size += bytes.length
  }
  const obj = (n: number, body: string | (() => void)) => {
    offsets[n] = size
    push(`${n} 0 obj\n`)
    if (typeof body === 'string') push(body)
    else body()
    push('\nendobj\n')
  }

  push('%PDF-1.4\n%âãÏÓ\n')
  // 1 catalog, 2 page tree, then 3 objects per page: page, content, image
  const pageIds = pages.map((_, i) => 3 + i * 3)
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>')
  obj(2, `<< /Type /Pages /Count ${pages.length} /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] >>`)

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i]!
    const [pageId, contentId, imageId] = [pageIds[i]!, pageIds[i]! + 1, pageIds[i]! + 2]
    const draw = `q ${A4.w} 0 0 ${A4.h} 0 0 cm /Im0 Do Q`
    obj(pageId, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4.w} ${A4.h}] /Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`)
    obj(contentId, `<< /Length ${draw.length} >>\nstream\n${draw}\nendstream`)
    const jpeg = new Uint8Array(await p.jpeg.arrayBuffer())
    obj(imageId, () => {
      push(`<< /Type /XObject /Subtype /Image /Width ${p.width} /Height ${p.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`)
      push(jpeg)
      push('\nendstream')
    })
  }

  const count = 3 + pages.length * 3
  const xref = size
  push(`xref\n0 ${count}\n0000000000 65535 f \n`)
  for (let n = 1; n < count; n++) push(`${String(offsets[n]).padStart(10, '0')} 00000 n \n`)
  push(`trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`)
  return new Blob(chunks as BlobPart[], { type: 'application/pdf' })
}
