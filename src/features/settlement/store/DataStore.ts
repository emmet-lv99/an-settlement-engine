import * as XLSX from 'xlsx'
import { create } from 'zustand'
import type { NWayComparisonResult } from '../modules/step7-results-dashboard/types/ComparisonTypes'
import { ParsedDataDto } from '../types/DataDto.dto'

interface DataStore {
  currentStep: number
  setCurrentStep: (step: number) => void
  skippedSteps: Set<number>
  setSkippedSteps: (steps: Set<number>) => void
  optionalSteps: Set<number>
  files: File[] | null
  setFiles: (file: File[] | File | null) => void
  parsedData: ParsedDataDto[]
  setParsedData: (data: ParsedDataDto[]) => void
  setDeletedFiles: (files: File[]) => void
  selectedDataId: number | null
  setSelectedDataId: (id: number) => void
  // Step 7: N-Way 비교 결과
  comparisonResult: NWayComparisonResult | null
  setComparisonResult: (result: NWayComparisonResult | null) => void
  isComparisonLoading: boolean
  setIsComparisonLoading: (loading: boolean) => void
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

const handleReadFile = (
  file: File,
): Promise<{ sheetName: string; json: Record<string, unknown>[] }> => {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.readAsArrayBuffer(file)
    reader.onload = e => {
      const data = e.target?.result as ArrayBuffer
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      // 날짜를 자동으로 변환하는 옵션 추가
      const rawJson = XLSX.utils.sheet_to_json(sheet, {
        dateNF: 'yyyy-mm-dd hh:mm:ss', // 날짜 포맷 지정
        raw: false, // 날짜를 문자열로 변환
      }) as Record<string, unknown>[]

      // 🔧 컬럼명 정규화 적용 (띄어쓰기 제거)
      const json = rawJson.map(row => normalizeObjectKeys(row))

      console.log(`✅ [컬럼명 정규화] ${file.name}`)
      if (rawJson.length > 0) {
        console.log('  원본 컬럼:', Object.keys(rawJson[0]))
        console.log('  정규화 후:', Object.keys(json[0]))
      }

      resolve({ sheetName, json })
    }
  })
}

const useDataStore = create<DataStore>((set, get) => ({
  skippedSteps: new Set(),
  setSkippedSteps: steps => set({ skippedSteps: steps }),
  selectedDataId: null,
  setSelectedDataId: id => set({ selectedDataId: id }),
  optionalSteps: new Set([5]),
  setOptionalSteps: (steps: Set<number>) => {
    set({ optionalSteps: steps })
  },
  currentStep: 0,
  setCurrentStep: step => set({ currentStep: step }),
  files: null,
  parsedData: [],
  setParsedData: data => set({ parsedData: data }),
  // Step 7: 비교 결과
  comparisonResult: null,
  setComparisonResult: result => set({ comparisonResult: result }),
  isComparisonLoading: false,
  setIsComparisonLoading: loading => set({ isComparisonLoading: loading }),
  setDeletedFiles: async files => {
    // 1. 먼저 parsedData를 빈 배열로 초기화
    set({ parsedData: [] })

    // 2. 파일들을 순차적으로 처리
    const newParsedData: ParsedDataDto[] = []
    const emptyFiles: string[] = []
    let validIndex = 1

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const { sheetName, json } = await handleReadFile(file)

      // 빈 파일 검증
      if (!json || json.length === 0) {
        emptyFiles.push(file.name)
        continue
      }

      const parsedDataItem = new ParsedDataDto(
        validIndex++, // 유효한 파일에만 순차적 ID
        file.name,
        sheetName,
        json as Record<string, unknown>[],
      )
      newParsedData.push(parsedDataItem)
    }

    // 빈 파일이 있으면 경고
    if (emptyFiles.length > 0) {
      alert(`다음 파일은 비어있어 제외되었습니다:\n${emptyFiles.join('\n')}`)
    }

    // 3. 모든 데이터를 한 번에 설정
    const validFiles = files.filter(file => !emptyFiles.includes(file.name))
    set({ parsedData: newParsedData })
    set({ files: validFiles.length > 0 ? validFiles : null })
  },
  setFiles: async file => {
    const { files } = get()

    // null 이면 아무것도 하지 않음
    if (file === null) {
      return
    }

    // 배열로 정규화
    const filesToAdd = Array.isArray(file) ? file : [file]

    // 중복 파일 체크
    if (files && files.length > 0) {
      const duplicates = filesToAdd.filter(newFile =>
        files.some(existingFile => existingFile.name === newFile.name),
      )

      if (duplicates.length > 0) {
        const duplicateNames = duplicates.map(f => f.name).join(', ')
        alert(`이미 추가된 파일입니다: ${duplicateNames}`)
        return
      }
    }

    // 파일 목록 업데이트
    const newFiles = files ? [...files, ...filesToAdd] : filesToAdd
    set({ files: newFiles })

    // 모든 파일을 파싱하여 parsedData 생성
    const newParsedData: ParsedDataDto[] = []
    const emptyFiles: string[] = []
    let validIndex = 1

    for (let i = 0; i < newFiles.length; i++) {
      const currentFile = newFiles[i]
      const { sheetName, json } = await handleReadFile(currentFile)

      // 빈 파일 검증
      if (!json || json.length === 0) {
        emptyFiles.push(currentFile.name)
        continue
      }

      const parsedDataItem = new ParsedDataDto(
        validIndex++, // 유효한 파일에만 순차적 ID
        currentFile.name,
        sheetName,
        json as Record<string, unknown>[],
      )
      newParsedData.push(parsedDataItem)
    }

    // 빈 파일이 있으면 경고
    if (emptyFiles.length > 0) {
      alert(
        `다음 파일은 비어있어 추가할 수 없습니다:\n${emptyFiles.join('\n')}`,
      )

      // 빈 파일 제외한 파일 목록으로 업데이트
      const validFiles = newFiles.filter(
        file => !emptyFiles.includes(file.name),
      )
      set({ files: validFiles.length > 0 ? validFiles : null })
    }

    set({ parsedData: newParsedData })
  },
}))

export default useDataStore
