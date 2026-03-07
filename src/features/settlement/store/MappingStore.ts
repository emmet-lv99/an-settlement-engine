import { create } from 'zustand'
import { ParsedDataDto } from '../types/DataDto.dto'
import useDataStore from './DataStore'

interface FileConfiguration {
  fileName: string
  tableData: {
    masterColumnName: string
    selectedTargetColumn: string | null
    isMatched: boolean
  }[]
  matchedStatus: boolean
  selectOptions: string[]
  columnMappings: {
    [masterColumn: string]: string | null
  }
  // 나중에 "상품명" 열의 "★생생효소"라는 값을 처리해야 할 때, valueMappings.get("상품명").get("★생생효소")를 통해 "생생효소 더그레인"이라는 표준 값을 정확하고 빠르게 찾아낼 수 있다.
  valueMappings: Map<string, Map<string, string>>
  // 5단계 진행률을 저장
  valueMatchProgress: {
    // 파일 전체의 값 매칭 진행률 (0 ~ 100)
    overallProgress: number

    // 각 컬럼별 값 매칭 진행률을 저장하는 Map
    // Key: 기준 컬럼명 (예: "상품명")
    // Value: 해당 컬럼의 진행률 (0 ~ 100)
    progressByColumn: Map<string, number>
  }
  // 6단계 : '수량' 컬럼 전용 값 매핑 규칙
  // 예: { "옵션=옵션1" => "1" }
  quantityMappings: Map<string, string>
  // 4단계: 원본 파일의 실제 수량 컬럼 (선택사항)
  // 주문수량(숫자만) 컬럼이 텍스트(예: 상품옵션)로 매핑된 경우,
  // 실제 수량 값을 가져올 원본 컬럼을 지정
  // 예: "수량"
  baseQuantityColumn?: string | null
}

interface MappingStore {
  // 3단계 : 위 목록 중 '키' 역할을 하는 컬럼의 이름
  // 예: "주문번호"
  masterKeyColumnName: string | null
  setMasterKeyColumnName: (columnName: string) => void
  // 3단계 : 위 목록 중 '수량' 역할을 하는 컬럼의 이름
  // 예: "수량"
  masterQuantityColumnName: string | null
  setMasterQuantityColumnName: (columnName: string) => void
  // 3단계 : 비교에 사용할 열을 선택해주세요. 주문번호와 상품명을 필수선택입니다.
  // 예: [{ id: 1, column_name: "주문번호" }, { id: 2, column_name: "상품명" }]
  selectedComparisonTargetColumns: { id: number; column_name: string }[]

  handleRowClick: (row: { id: number; column_name: string }) => void
  handleRowClickAll: (
    rows: { id: number; column_name: string; data_sample: string }[],
  ) => void
  resetMapping: () => void
  fileConfigurations: Map<string, FileConfiguration>
  initFileConfigurations: (fileNames: ParsedDataDto[]) => void
  setFileConfigurations: (configs: Map<string, FileConfiguration>) => void
  step4ActiveTab: string | null
  setStep4ActiveTab: (tab: string) => void
  // 4단계 임시 편집 데이터
  temporaryEdits: Map<
    string, // fileName
    {
      masterColumnName: string
      selectedTargetColumn: string
    }[]
  >
  // 4단계 임시 편집 데이터 설정
  setTemporaryEdits: (
    fileName: string,
    masterColumnName: string,
    selectedTargetColumn: string,
  ) => void
  // 4단계: 실제 수량 컬럼 설정
  setBaseQuantityColumn: (fileName: string, columnName: string | null) => void
  step5ActiveFile: string | null
  setStep5ActiveFile: (file: string) => void
  // step5ActiveColumn 은 step5ActiveFile 마다 선택된 컬럼이 다르다.
  // 예를 들어, step5ActiveFile 이 "file1" 이고, step5ActiveColumn 이 "column1" 이면, file1 의 column1 컬럼을 선택한 것이다.
  // 이때, file2로 옮기면 file2 는 별도의 column 선택이 필요하다.
  // 즉, step5ActiveColumn 은 step5ActiveFile 에 따라 다르다.
  // 이를 위해 step5ActiveColumn 는 new Map<string, string>() 으로 관리한다.

  step5ActiveColumn: Map<string, string>
  setStep5ActiveColumn: (file: string, column: string) => void
  setStep5ValueMatchProgress: (
    file: string,
    column: string,
    overallProgress: number,
    columnProgress: number,
  ) => void
  /**
   * Step5 값 매핑 데이터를 fileConfigurations에 저장하는 함수
   * 기존 매핑 규칙이 있으면 병합하고, 없으면 새로 추가함
   * @param fileName - 저장할 파일명
   * @param columnMappings - 컬럼별 값 매핑 데이터
   */
  saveStep5ValueMappings: (
    fileName: string,
    columnMappings: Map<
      string,
      {
        comparisonValue: string
        masterValue: string | null
      }[]
    >,
  ) => void

  /**
   * Step5 값 매핑 작업 중 임시로 저장되는 편집 데이터
   *
   * 사용 시나리오:
   * 1. 사용자가 DataTable에서 Select로 값을 선택
   * 2. 선택한 값이 이 Map에 임시 저장됨
   * 3. "저장" 버튼을 누르면 saveStep5ValueMappings()를 통해
   *    fileConfigurations.valueMappings로 변환되어 영구 저장됨
   *
   * 구조 예시:
   * Map {
   *   "공동구매_주문서.xlsx" => Map {
   *     "주문상품명" => [
   *       { masterColumnValue: "★생생효소", mappedValue: "생생효소 더그레인" },
   *       { masterColumnValue: "프로폴리스", mappedValue: "프로폴리스 스프레이" }
   *     ],
   *     "상품옵션" => [
   *       { masterColumnValue: "옵션1", mappedValue: "표준옵션1" }
   *     ]
   *   }
   * }
   */
  step5TemporaryEdits: Map<
    string, // fileName
    Map<
      string, // columnName
      {
        comparisonValue: string // 비교 파일 값 (자동 생성, 텍스트 표시)
        masterValue: string | null // 기준 파일 값 (사용자가 Select로 선택)
      }[]
    >
  >

  /**
   * step5TemporaryEdits를 업데이트하는 함수
   * DataTable에서 Select 값이 변경될 때마다 호출됨
   */
  setStep5TemporaryEdits: (
    edits: Map<
      string, // fileName
      Map<
        string, // columnName
        {
          comparisonValue: string
          masterValue: string | null
        }[]
      >
    >,
  ) => void
  setStep5DeleteTableRow: (file: string, column: string, rowId: number) => void
  step6ActiveFile: string | null
  setStep6ActiveFile: (file: string) => void
  // Step6 임시 편집 데이터 (탭 전환 시에도 유지)
  step6TemporaryEdits: Map<
    string, // fileName
    Map<string, string> // { target_column_value => quantity_rule }
  >
  setStep6TemporaryEdits: (
    fileName: string,
    targetValue: string,
    quantityRule: string,
  ) => void
  // Step6 특정 파일의 수량 규칙 전체 초기화
  resetStep6TemporaryEdits: (fileName: string) => void
  // Step6 수량 규칙을 fileConfigurations에 저장
  saveStep6QuantityMappings: (fileName: string) => void
  // step7 파일 병합 모드 선택
  step7ComparisonMode: 'BASIC' | 'ADVANCED' | null
  setStep7ComparisonMode: (mode: 'BASIC' | 'ADVANCED') => void
  // step7 파일 병합 그룹 목록
  // Key: groupId (예: "group-1", "group-1234567890")
  // Value: { title: 그룹명, files: 파일명 배열 }
  step7ComparisonGroups: Map<string, { title: string; files: string[] }>
  setStep7ComparisonGroups: (
    groups:
      | Map<string, { title: string; files: string[] }>
      | ((
          prevGroups: Map<string, { title: string; files: string[] }>,
        ) => Map<string, { title: string; files: string[] }>),
  ) => void
  // 특정 그룹의 이름만 업데이트
  updateStep7GroupTitle: (groupId: string, newTitle: string) => void
}

export const useMappingStore = create<MappingStore>((set, get) => ({
  // 3단계 : 위 목록 중 '키' 역할을 하는 컬럼의 이름
  masterKeyColumnName: null,
  setMasterKeyColumnName: (columnName: string) => {
    set({ masterKeyColumnName: columnName })
  },
  masterQuantityColumnName: null,
  setMasterQuantityColumnName: (columnName: string) => {
    set({ masterQuantityColumnName: columnName })
  },
  // 3단계 : 비교에 사용할 열을 선택해주세요. 주문번호와 상품명을 필수선택입니다.
  // 예: [{ id: 1, column_name: "주문번호" }, { id: 2, column_name: "상품명" }]
  selectedComparisonTargetColumns: [],
  fileConfigurations: new Map<string, FileConfiguration>(),
  step5ActiveFile: null,
  setStep5ActiveFile: (file: string) => set({ step5ActiveFile: file }),
  step5TemporaryEdits: new Map(),
  setStep5TemporaryEdits: edits => set({ step5TemporaryEdits: edits }),
  step5ActiveColumn: new Map<string, string>(),
  setStep5ActiveColumn: (file: string, column: string) =>
    set({
      step5ActiveColumn: new Map(get().step5ActiveColumn).set(file, column),
    }),
  setStep5DeleteTableRow: () => {
    // 더 이상 사용하지 않음 (행이 자동 생성되므로 삭제 불가)
    console.warn('setStep5DeleteTableRow는 더 이상 사용되지 않습니다.')
  },
  step6ActiveFile: null,
  setStep6ActiveFile: (file: string) => set({ step6ActiveFile: file }),
  step6TemporaryEdits: new Map(),
  setStep6TemporaryEdits: (
    fileName: string,
    targetValue: string,
    quantityRule: string,
  ) => {
    const step6TemporaryEdits = get().step6TemporaryEdits
    const currentEdits = step6TemporaryEdits.get(fileName) || new Map()
    const updatedEdits = new Map(currentEdits)
    updatedEdits.set(targetValue, quantityRule)

    set({
      step6TemporaryEdits: new Map(step6TemporaryEdits).set(
        fileName,
        updatedEdits,
      ),
    })
  },
  resetStep6TemporaryEdits: (fileName: string) => {
    const step6TemporaryEdits = get().step6TemporaryEdits
    const currentEdits = step6TemporaryEdits.get(fileName)

    if (currentEdits) {
      // 모든 키의 값을 '1'로 초기화
      const resetEdits = new Map<string, string>()
      currentEdits.forEach((_, key) => {
        resetEdits.set(key, '1')
      })

      set({
        step6TemporaryEdits: new Map(step6TemporaryEdits).set(
          fileName,
          resetEdits,
        ),
      })
    }
  },
  saveStep6QuantityMappings: (fileName: string) => {
    const currentConfig = get().fileConfigurations.get(fileName)
    const temporaryEdits = get().step6TemporaryEdits.get(fileName)
    const masterQuantityColumnName = get().masterQuantityColumnName

    if (!currentConfig || !temporaryEdits || !masterQuantityColumnName) return

    // 수량 컬럼의 원본 컬럼명 가져오기 (매핑 후 확인용)
    const quantitySourceColumn =
      currentConfig.columnMappings[masterQuantityColumnName]

    if (!quantitySourceColumn) {
      console.warn(
        `⚠️ [Step6] 수량 컬럼 매핑을 찾을 수 없습니다: ${masterQuantityColumnName}`,
      )
      return
    }

    // "값" => "규칙" 을 "기준컬럼명=값" => "규칙" 형식으로 변환
    // ⚠️ 중요: 원본 컬럼명이 아닌 기준(master) 컬럼명을 사용해야 정규화 후 매칭됨!
    const updatedQuantityMappings = new Map<string, string>()
    temporaryEdits.forEach((rule, value) => {
      const key = `${masterQuantityColumnName}=${value}`
      updatedQuantityMappings.set(key, rule)
      console.log(
        `  🔧 [Step6] 수량 규칙: "${key}" => "${rule}" (원본: ${quantitySourceColumn})`,
      )
    })

    // fileConfigurations에 저장
    set({
      fileConfigurations: new Map(get().fileConfigurations).set(fileName, {
        ...currentConfig,
        quantityMappings: updatedQuantityMappings,
      }),
    })

    console.log(
      `✅ [Step6] ${fileName} 수량 규칙 저장 완료 (${updatedQuantityMappings.size}개)`,
    )
  },
  setStep5ValueMatchProgress: (
    file: string,
    column: string,
    overallProgress: number,
    columnProgress: number,
  ) => {
    set({
      fileConfigurations: new Map(get().fileConfigurations).set(file, {
        ...get().fileConfigurations.get(file),
        valueMatchProgress: {
          overallProgress,
          progressByColumn: new Map(
            get().fileConfigurations.get(file)?.valueMatchProgress
              ?.progressByColumn || new Map<string, number>(),
          ).set(column, columnProgress),
        },
      } as FileConfiguration),
    })
  },
  /**
   * Step5 값 매핑 데이터를 fileConfigurations에 저장하는 함수
   *
   * 동작 방식:
   * 1. 기존 valueMappings를 복사 (기존 데이터 보존)
   * 2. 새로운 columnMappings를 순회하며:
   *    - 해당 컬럼이 이미 존재하면: 기존 값들과 병합 (새 값으로 덮어쓰기)
   *    - 해당 컬럼이 없으면: 새로운 컬럼으로 추가
   * 3. 업데이트된 valueMappings를 fileConfigurations에 저장
   *
   * @param fileName - 저장할 파일명 (예: "공동구매_주문서.xlsx")
   * @param columnMappings - 저장할 컬럼별 값 매핑 데이터
   *                         Map<컬럼명, Array<{value, mappedValue}>>
   *
   * @example
   * // 기존 데이터
   * valueMappings = {
   *   "주문상품명": { "★생생효소" => "생생효소 더그레인" }
   * }
   *
   * // 새로 저장
   * saveStep5ValueMappings("file1.xlsx", Map {
   *   "주문상품명" => [{ value: "★생생효소", mappedValue: "생생효소 V2" }],
   *   "상품옵션" => [{ value: "옵션1", mappedValue: "표준옵션1" }]
   * })
   *
   * // 결과 (기존 + 신규 병합)
   * valueMappings = {
   *   "주문상품명": { "★생생효소" => "생생효소 V2" },  // 업데이트됨
   *   "상품옵션": { "옵션1" => "표준옵션1" }         // 새로 추가됨
   * }
   */
  saveStep5ValueMappings: (fileName, columnMappings) => {
    const currentConfig = get().fileConfigurations.get(fileName)
    if (!currentConfig) {
      console.error(
        `⚠️ [MappingStore] 파일 설정을 찾을 수 없습니다: ${fileName}`,
      )
      return
    }

    console.log('🔄 [MappingStore] saveStep5ValueMappings 실행')
    console.log(`  - 파일명: ${fileName}`)
    console.log(`  - 기존 valueMappings:`, currentConfig.valueMappings)

    // 1. 기존 valueMappings를 복사 (기존 데이터 보존)
    const updatedValueMappings = new Map<string, Map<string, string>>(
      currentConfig.valueMappings,
    )

    // 2. 새로운 columnMappings를 순회하며 병합
    columnMappings.forEach((mappings, columnName) => {
      console.log(`  - [${columnName}] 컬럼 처리 중...`)

      // 해당 컬럼의 기존 매핑 가져오기 (없으면 빈 Map)
      const existingColumnMap =
        updatedValueMappings.get(columnName) || new Map<string, string>()
      const updatedColumnMap = new Map<string, string>(existingColumnMap)

      // 새로운 매핑 데이터를 기존 Map에 병합
      mappings.forEach(({ comparisonValue, masterValue }) => {
        if (masterValue) {
          // 비교 → 기준 매핑 저장
          // (정규화 시 비교 파일의 값을 기준 파일 값으로 변환하기 위함)
          updatedColumnMap.set(comparisonValue, masterValue)
          console.log(`    ✓ 저장: "${comparisonValue}" → "${masterValue}"`)
        }
      })

      // 업데이트된 컬럼 매핑을 저장 (빈 Map은 저장하지 않음)
      if (updatedColumnMap.size > 0) {
        updatedValueMappings.set(columnName, updatedColumnMap)
        console.log(`    총 ${updatedColumnMap.size}개 매핑 저장됨`)
      }
    })

    // 3. fileConfigurations에 저장
    const updatedConfig = {
      ...currentConfig,
      valueMappings: updatedValueMappings,
    }

    set({
      fileConfigurations: new Map(get().fileConfigurations).set(
        fileName,
        updatedConfig,
      ),
    })

    console.log('✅ [MappingStore] 저장 완료')
    console.log(`  - 최종 valueMappings:`, updatedValueMappings)
  },

  step4ActiveTab: null,
  temporaryEdits: new Map<
    string,
    { masterColumnName: string; selectedTargetColumn: string }[]
  >(),
  setTemporaryEdits: (
    fileName: string,
    masterColumnName: string,
    selectedTargetColumn: string,
  ) => {
    const temporaryEdits = get().temporaryEdits

    // 해당 fileName의 기존 배열 가져오기 (없으면 빈 배열)
    const currentEdits = temporaryEdits.get(fileName) || []

    // 해당 masterColumnName이 있는지 찾기
    const existingIndex = currentEdits.findIndex(
      item => item.masterColumnName === masterColumnName,
    )

    // 기존 배열 복사
    const updatedEditsArray = [...currentEdits]

    if (existingIndex !== -1) {
      // 이미 존재하면 업데이트
      updatedEditsArray[existingIndex] = {
        masterColumnName,
        selectedTargetColumn,
      }
    } else {
      // 존재하지 않으면 추가
      updatedEditsArray.push({
        masterColumnName,
        selectedTargetColumn,
      })
    }

    // 새로운 Map 생성하여 업데이트
    const updatedEdits = new Map<
      string,
      { masterColumnName: string; selectedTargetColumn: string }[]
    >(temporaryEdits)
    updatedEdits.set(fileName, updatedEditsArray)

    set({
      temporaryEdits: updatedEdits,
    })
  },
  setBaseQuantityColumn: (fileName: string, columnName: string | null) => {
    const currentConfig = get().fileConfigurations.get(fileName)
    if (!currentConfig) {
      console.error(
        `⚠️ [MappingStore] 파일 설정을 찾을 수 없습니다: ${fileName}`,
      )
      return
    }

    const updatedConfig = {
      ...currentConfig,
      baseQuantityColumn: columnName,
    }

    set({
      fileConfigurations: new Map(get().fileConfigurations).set(
        fileName,
        updatedConfig,
      ),
    })

    console.log(
      `✅ [MappingStore] 실제 수량 컬럼 저장: ${fileName} → ${columnName || '없음'}`,
    )
  },
  setStep4ActiveTab: (tab: string) => set({ step4ActiveTab: tab }),
  initFileConfigurations: parsedData => {
    const configs = parsedData.map(data => {
      const selectOptions = data.data[0] ? [...Object.keys(data.data[0])] : []

      return [
        data.name,
        {
          fileName: data.name,
          matchedStatus: false,
          tableData: [],
          selectOptions,
          columnMappings: {},
          valueMappings: new Map<string, Map<string, string>>(),
          valueMatchProgress: {
            overallProgress: 0,
            progressByColumn: new Map<string, number>(),
          },
          quantityMappings: new Map<string, string>(),
          baseQuantityColumn: null, // 초기값: null
        },
      ] as [string, FileConfiguration]
    })

    set({
      fileConfigurations: new Map<string, FileConfiguration>(configs),
    })
  },
  resetMapping: () => {
    set({ selectedComparisonTargetColumns: [] })
  },
  setFileConfigurations: configs => {
    set({ fileConfigurations: configs })
  },
  // 3단계 : 비교에 사용할 열을 선택해주세요. 주문번호와 상품명을 필수선택입니다.
  // 예: [{ id: 1, column_name: "주문번호" }, { id: 2, column_name: "상품명" }]
  handleRowClick: row => {
    if (get().selectedComparisonTargetColumns.some(r => r.id === row.id)) {
      set({
        selectedComparisonTargetColumns:
          get().selectedComparisonTargetColumns.filter(r => r.id !== row.id),
      })
    } else {
      set({
        selectedComparisonTargetColumns: [
          ...get().selectedComparisonTargetColumns,
          row,
        ],
      })
    }
  },

  handleRowClickAll: rows => {
    if (get().selectedComparisonTargetColumns.length === rows.length) {
      set({
        selectedComparisonTargetColumns: [],
      })
    } else {
      set({
        selectedComparisonTargetColumns: rows.map(row => ({
          id: row.id,
          column_name: row.column_name,
        })),
      })
    }
  },
  step7ComparisonMode: null,
  setStep7ComparisonMode: (mode: 'BASIC' | 'ADVANCED') =>
    set({ step7ComparisonMode: mode }),
  step7ComparisonGroups: new Map<string, { title: string; files: string[] }>(),
  setStep7ComparisonGroups: groups => {
    if (typeof groups === 'function') {
      set(state => ({
        step7ComparisonGroups: groups(state.step7ComparisonGroups),
      }))
    } else {
      set({ step7ComparisonGroups: groups })
    }
  },
  updateStep7GroupTitle: (groupId: string, newTitle: string) => {
    const currentGroups = get().step7ComparisonGroups
    const targetGroup = currentGroups.get(groupId)

    // 해당 그룹이 존재하는지 확인
    if (!targetGroup) {
      console.warn(`⚠️ 그룹을 찾을 수 없습니다: ${groupId}`)
      return
    }

    // 기존 그룹의 파일 목록은 유지하고 title만 업데이트
    const updatedGroups = new Map(currentGroups)
    updatedGroups.set(groupId, {
      ...targetGroup,
      title: newTitle,
    })

    set({ step7ComparisonGroups: updatedGroups })
    console.log(
      `✏️ 그룹 이름 변경: ${groupId} | "${targetGroup.title}" → "${newTitle}"`,
    )
  },
}))

// DataStore의 변화를 감지하여 매핑 데이터 초기화
let prevFiles: File[] | null | undefined = undefined
let prevParsedData: ParsedDataDto[] | undefined = undefined

useDataStore.subscribe(state => {
  const filesChanged = state.files !== prevFiles
  const parsedDataChanged = state.parsedData !== prevParsedData

  if (filesChanged || parsedDataChanged) {
    // 매핑 데이터 초기화
    useMappingStore.getState().resetMapping()

    // 파일 설정 초기화
    if (state.parsedData.length > 0) {
      useMappingStore.getState().initFileConfigurations(state.parsedData)
    }
  }

  prevFiles = state.files
  prevParsedData = state.parsedData
})

export default useMappingStore
