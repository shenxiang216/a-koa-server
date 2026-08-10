import { createHash } from 'crypto'

/**
 * 加密
 * @param {string} algorithm
 * @param {string} content
 * @returns {string}
 */
export const encrypt = (algorithm: string, content: string): string => {
  const hash = createHash(algorithm)
  hash.update(content)
  return hash.digest('hex')
}
