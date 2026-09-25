// ─── Multimodal Content Support ───────────────────────────────────────────────

import type { Base64ImageSource, URLImageSource, ImageBlockParam, ContentBlockParam } from './types.js'

export type ImageFormat = 'png' | 'jpeg' | 'gif' | 'webp'
export type DocumentFormat = 'pdf' | 'txt' | 'md' | 'html'

export type MultimodalImage = {
  type: 'image'
  source: Base64ImageSource | URLImageSource
  description?: string
}

export type MultimodalDocument = {
  type: 'document'
  source: {
    type: 'base64' | 'url'
    media_type: string
    data?: string
    url?: string
  }
  description?: string
}

export type MultimodalContent = string | MultimodalImage | MultimodalDocument

// ─── Image Helpers ────────────────────────────────────────────────────────────

/**
 * Create an image from base64 data
 */
export function createImage(
  base64Data: string,
  mediaType: ImageFormat | string = 'png',
  description?: string,
): MultimodalImage {
  const mimeType = mediaType.startsWith('image/') ? mediaType : `image/${mediaType}`

  return {
    type: 'image',
    source: {
      type: 'base64',
      media_type: mimeType,
      data: base64Data,
    },
    description,
  }
}

/**
 * Create an image from URL
 */
export function createImageFromUrl(
  url: string,
  description?: string,
): MultimodalImage {
  return {
    type: 'image',
    source: {
      type: 'url',
      url,
    },
    description,
  }
}

/**
 * Create an image from file path (Node.js only)
 */
export async function createImageFromFile(
  filePath: string,
  description?: string,
): Promise<MultimodalImage> {
  if (typeof window !== 'undefined') {
    throw new Error('createImageFromFile is only available in Node.js')
  }

  const fs = await import('fs')
  const path = await import('path')

  const buffer = await fs.promises.readFile(filePath)
  const base64 = buffer.toString('base64')
  const ext = path.extname(filePath).slice(1).toLowerCase() as ImageFormat

  const mediaTypeMap: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
  }

  return {
    type: 'image',
    source: {
      type: 'base64',
      media_type: mediaTypeMap[ext] || 'application/octet-stream',
      data: base64,
    },
    description,
  }
}

// ─── Document Helpers ─────────────────────────────────────────────────────────

/**
 * Create a document from base64 data
 */
export function createDocument(
  base64Data: string,
  mediaType: DocumentFormat | string = 'pdf',
  description?: string,
): MultimodalDocument {
  const mimeType =
    mediaType.startsWith('application/') || mediaType.startsWith('text/')
      ? mediaType
      : getDocumentMimeType(mediaType)

  return {
    type: 'document',
    source: {
      type: 'base64',
      media_type: mimeType,
      data: base64Data,
    },
    description,
  }
}

/**
 * Create a document from URL
 */
export function createDocumentFromUrl(
  url: string,
  description?: string,
): MultimodalDocument {
  return {
    type: 'document',
    source: {
      type: 'url',
      url,
      media_type: 'application/pdf',
    },
    description,
  }
}

/**
 * Create a document from file path (Node.js only)
 */
export async function createDocumentFromFile(
  filePath: string,
  description?: string,
): Promise<MultimodalDocument> {
  if (typeof window !== 'undefined') {
    throw new Error('createDocumentFromFile is only available in Node.js')
  }

  const fs = await import('fs')
  const path = await import('path')

  const buffer = await fs.promises.readFile(filePath)
  const base64 = buffer.toString('base64')
  const ext = path.extname(filePath).slice(1).toLowerCase()

  return {
    type: 'document',
    source: {
      type: 'base64',
      media_type: getDocumentMimeType(ext),
      data: base64,
    },
    description,
  }
}

// ─── Utility Functions ────────────────────────────────────────────────────────

function getDocumentMimeType(ext: string): string {
  const mimeMap: Record<string, string> = {
    pdf: 'application/pdf',
    txt: 'text/plain',
    md: 'text/markdown',
    html: 'text/html',
    htm: 'text/html',
  }
  return mimeMap[ext] || 'application/octet-stream'
}

/**
 * Convert multimodal content to ContentBlockParam array
 */
export function multimodalToContentBlocks(
  content: MultimodalContent[],
): ContentBlockParam[] {
  return content.flatMap(block => {
    if (typeof block === 'string') {
      return { type: 'text', text: block }
    }

    if (block.type === 'image') {
      return {
        type: 'image',
        source: block.source,
      } as ImageBlockParam
    }

    // Documents might need special handling based on API support
    if (block.type === 'document') {
      // For now, convert to text representation or skip
      const description = block.description ? `Document: ${block.description}` : 'Document'
      return {
        type: 'text',
        text: description,
      }
    }

    return []
  })
}

/**
 * Check if content is an image
 */
export function isImage(block: MultimodalContent): block is MultimodalImage {
  return typeof block !== 'string' && block.type === 'image'
}

/**
 * Check if content is a document
 */
export function isDocument(block: MultimodalContent): block is MultimodalDocument {
  return typeof block !== 'string' && block.type === 'document'
}
