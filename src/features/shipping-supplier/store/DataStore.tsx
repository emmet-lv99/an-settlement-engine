import * as XLSX from 'xlsx'
import { create } from 'zustand'
import { ParsedDataDto } from '../types/DataDto.dto'

interface DataStore {
  currentStep: number
  setCurrentStep: (step: number) => void
  parsedData: ParsedDataDto[]
  setParsedData: (parsedData: ParsedDataDto[]) => void
  files: File[] | null
  setFiles: (file: File | File[] | null) => void
  sheetNames: string[]
  setSheetNames: (sheetNames: string[]) => void
  deletedFiles: File[]
  setDeletedFiles: (deletedFiles: File[]) => void
}

/**
 * 컬럼명 정규화 함수
 * 띄어쓰기, 특수문자 등을 제거하여 일관된 컬럼명을 생성합니다.
 */
const normalizeColumnName = (columnName: string): string => {
  return columnName
    .replace(/\s+/g, '') // 모든 공백 제거
    .trim()
}

/**
 * 객체의 모든 키(컬럼명)를 정규화합니다.
 */
const normalizeObjectKeys = (
  obj: Record<string, unknown>,
): Record<string, unknown> => {
  const normalized: Record<string, unknown> = {}
  Object.entries(obj).forEach(([key, value]) => {
    const normalizedKey = normalizeColumnName(key)
    normalized[normalizedKey] = value
  })
  return normalized
}

const handleReadFile = async (file: File):Promise<{sheetName: string; json: Record<string, unknown>[]}> => {
  const data = await file.arrayBuffer()
  const workbook = XLSX.read(data, {type: 'array'})
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  
  const rawJson = XLSX.utils.sheet_to_json(sheet, {
    dateNF: 'yyyy-mm-dd hh:mm:ss', // 날짜 포맷 지정
    raw: false, // 날짜를 문자열로 변환
  }) as Record<string, unknown>[]

  const json = rawJson.map(row => normalizeObjectKeys(row))

  console.log(`✅ [컬럼명 정규화] ${file.name}`)
  if (rawJson.length > 0) {
    console.log('  원본 컬럼:', Object.keys(rawJson[0]))
    console.log('  정규화 후:', Object.keys(json[0]))
  }

  return {sheetName, json}
}

const getFileSheetName = async (file: File):Promise<string[]> => {
  const data = await file.arrayBuffer()
  const workbook = XLSX.read(data, {type: 'array'})
  return workbook.SheetNames
}

const useDataStore = create<DataStore>((set, get) => ({
  currentStep: 0,
  setCurrentStep: step => set({ currentStep: step }),
  files: null,
  parsedData: [],
  sheetNames: [],
  setParsedData: data => set({ parsedData: data }),
  setSheetNames: sheetNames => set({ sheetNames }),

  setFiles: async file => {
    const { files } = get()
    if(file === null) {
      return
    }
    const filesToAdd = Array.isArray(file) ? file : [file]
  
    if(files && files.length > 0) {
      const duplicates = filesToAdd.filter(newFile => files.some(existingFile => existingFile.name === newFile.name))
      
      if(duplicates.length> 0) {
        const duplicateNames = duplicates.map(f => f.name).join(', ')
        alert(`이미 추가된 파일입니다: ${duplicateNames}`)
        return
      }
    }

    const newSheetNames: string[] = []    

    const newFiles = files ? [...files, ...filesToAdd] : filesToAdd
    set({files:newFiles})
    
    for (let i = 0; i < newFiles.length; i++) {
      const currentFile = newFiles[i]
      const sheetNames = await getFileSheetName(currentFile)
      newSheetNames.push(...sheetNames)
    }

    set({sheetNames: newSheetNames})
      },
  deletedFiles: [],
  setDeletedFiles: deletedFiles => set({ deletedFiles }),
}))

export default useDataStore