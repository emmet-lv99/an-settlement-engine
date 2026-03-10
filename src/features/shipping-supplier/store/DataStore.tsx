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
  setDeletedFiles: (deletedFiles: File[]) => void
  selectedSheetNames: string[]
  setSelectedSheetNames: (sheetNames: string[]) => void
  parseSelectedSheets: () => Promise<void>
  removeDuplicatesByTrackingNo: () => void
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

const handleReadFile = async (file: File, targetSheetNames: string[]) => {
  const data = await file.arrayBuffer()
  const workbook = XLSX.read(data, {type: 'array'})
  const result = targetSheetNames.map(sheetName => {
    const sheet = workbook.Sheets[sheetName]
    const rawJson = XLSX.utils.sheet_to_json(sheet, {
      dateNF: 'yyyy-mm-dd hh:mm:ss',
      raw: false,
    }) as Record<string, unknown>[]
    
    const json = rawJson.map(row => normalizeObjectKeys(row))
    
    return { 
      sheetName,
      json     
    }
  })
  console.log(result)
  return result
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
  selectedSheetNames: [],
  setSelectedSheetNames: selectedSheet => {
    set({selectedSheetNames: selectedSheet})
  },
  parseSelectedSheets: async () => {
    const { files, selectedSheetNames } = get()
    if(!files || files.length === 0) return

    const result = await handleReadFile(files[0], selectedSheetNames)
    
    const newParsedData = result.map((result, index) => new ParsedDataDto(
      index + 1,
      files[0].name,
      result.sheetName,
      result.json
    ))
    set({parsedData: newParsedData})
  },
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
    set({selectedSheetNames: newSheetNames})
  },
  setDeletedFiles: async remainingFiles => {
    set({sheetNames: []})

    const newSheetNames = []
    for(let i = 0; i < remainingFiles.length; i ++) {
      const currentFile = remainingFiles[i]
      const sheetNames = await getFileSheetName(currentFile)
      newSheetNames.push(...sheetNames)
    }

    set({sheetNames: newSheetNames})
    set({selectedSheetNames: newSheetNames})
    set({files: remainingFiles.length > 0 ? remainingFiles : null})
  },
  removeDuplicatesByTrackingNo: () => {
    const { parsedData } = get()
      let totalRemovedCount = 0
      const targetKey = '송장번호(대한통운)'
      const newParsedData = parsedData.map(sheet => {
        const originalCount = sheet.data.length
        const seenNumbers = new Set<string>()
        
        const uniqueData = sheet.data.filter(row => {
          const keyVal = String(row[targetKey] || '').trim()
          
          if (!keyVal) return true 
          if (seenNumbers.has(keyVal)) {
            return false 
          }
          
          seenNumbers.add(keyVal)
          return true 
        })
        const removedInThisSheet = originalCount - uniqueData.length
        totalRemovedCount += removedInThisSheet

        return {
          ...sheet,
          data: uniqueData
        }
      })
      if (totalRemovedCount > 0) {
        set({ parsedData: newParsedData })
        alert(`[${targetKey}] 기준, 총 ${totalRemovedCount}건의 중복 데이터가 제거되었습니다.`)
      } else {
        alert(`중복된 ${targetKey}가 없습니다.`)
      }
  },
}))

export default useDataStore