// ─── Message Helpers ──────────────────────────────────────────────────────────

import type {
  MessageParam,
  ContentBlockParam,
  TextBlockParam,
  ImageBlockParam,
  Base64ImageSource,
  URLImageSource,
  ContentBlock,
  TextBlock,
  Usage,
} from './types.js'

/**
 * Create a user message
 */
export function createUserMessage(content: string | ContentBlockParam[]): MessageParam {
  return {
    role: 'user',
    content,
  }
}

/**
 * Create an assistant message
 */
export function createAssistantMessage(content: string | ContentBlockParam[]): MessageParam {
  return {
    role: 'assistant',
    content,
  }
}

/**
 * Create a system message (as TextBlock array)
 */
export function createSystemMessage(content: string): TextBlockParam[] {
  return [{ type: 'text', text: content }]
}

/**
 * Create a text content block
 */
export function createTextBlock(text: string): TextBlockParam {
  return {
    type: 'text',
    text,
  }
}

/**
 * Create an image content block from base64
 */
export function createImageBlock(
  mediaType: string,
  base64Data: string,
): ImageBlockParam {
  return {
    type: 'image',
    source: {
      type: 'base64',
      media_type: mediaType,
      data: base64Data,
    },
  }
}

/**
 * Create an image content block from URL
 */
export function createImageFromUrl(url: string): ImageBlockParam {
  return {
    type: 'image',
    source: {
      type: 'url',
      url,
    } as URLImageSource,
  } as ImageBlockParam
}

/**
 * Create a base64 image source
 */
export function createBase64ImageSource(
  mediaType: string,
  data: string,
): Base64ImageSource {
  return {
    type: 'base64',
    media_type: mediaType,
    data,
  }
}

/**
 * Create a URL image source
 */
export function createUrlImageSource(url: string): URLImageSource {
  return {
    type: 'url',
    url,
  }
}

/**
 * Extract text content from message
 */
export function extractTextContent(message: MessageParam): string {
  if (typeof message.content === 'string') {
    return message.content
  }

  if (Array.isArray(message.content)) {
    return message.content
      .filter((block): block is TextBlockParam => block.type === 'text')
      .map(block => block.text)
      .join(' ')
  }

  return ''
}

/**
 * Get total token usage from message
 */
export function getTotalUsage(usage: Usage): number {
  return (
    usage.input_tokens +
    usage.output_tokens +
    (usage.cache_creation_input_tokens ?? 0) +
    (usage.cache_read_input_tokens ?? 0)
  )
}

/**
 * Check if content block is a text block
 */
export function isTextBlock(block: ContentBlock | ContentBlockParam): block is TextBlock {
  return block.type === 'text'
}

/**
 * Check if content block is an image block
 */
export function isImageBlock(block: ContentBlock | ContentBlockParam): block is ImageBlockParam {
  return block.type === 'image'
}

/**
 * Read image file as base64 (Node.js)
 */
export async function imageFileToBase64(filePath: string): Promise<Base64ImageSource> {
  // In browser environments, this would need to be provided differently
  if (typeof window !== 'undefined') {
    throw new Error('imageFileToBase64 is only available in Node.js environments')
  }

  const fs = await import('fs')
  const path = await import('path')

  const buffer = await fs.promises.readFile(filePath)
  const base64 = buffer.toString('base64')
  const ext = path.extname(filePath).slice(1)

  const mediaTypeMap: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
  }

  const mediaType = mediaTypeMap[ext] || 'application/octet-stream'

  return {
    type: 'base64',
    media_type: mediaType,
    data: base64,
  }
}

/**
 * Load image from file path (convenience wrapper)
 */
export async function imageFromFilePath(filePath: string): Promise<ImageBlockParam> {
  const source = await imageFileToBase64(filePath)
  return {
    type: 'image',
    source,
  }
}
