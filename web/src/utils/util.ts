export function parseSSE(buffer: string, onEvent: (type: string, data: any) => void) {
  buffer = buffer.replace(/\r\n/g, "\n")
  const blocks = buffer.split("\n\n")
  const remaining = blocks.pop() ?? ""
  for (const block of blocks) {
    const type = block.match(/^event:\s*(.+)$/m)?.[1]
    const data = block.match(/^data:\s*(.+)$/m)?.[1]
    if (type && data) { try { onEvent(type, JSON.parse(data)) } catch { /* wait for next complete event */ } }
  }
  return remaining
}