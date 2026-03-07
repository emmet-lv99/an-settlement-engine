export const sortByKoreanString = (array: string[]): string[] => {
  return [...array].sort((a, b) => a.localeCompare(b, 'ko-KR'))
}

export const sortByKoreanStringDesc = (array: string[]): string[] => {
  return [...array].sort((a, b) => b.localeCompare(a, 'ko-KR'))
}

export const sortByKoreanObjectKey = <T>(array: T[], key: keyof T): T[] => {
  return [...array].sort((a, b) =>
    String(a[key]).localeCompare(String(b[key]), 'ko-KR'),
  )
}
