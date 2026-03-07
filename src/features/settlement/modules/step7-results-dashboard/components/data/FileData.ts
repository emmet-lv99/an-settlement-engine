/**
 * ============================================
 * FileData.ts - 파일 병합 보드의 데이터 타입 정의
 * ============================================
 *
 * 이 파일은 드래그 앤 드롭 파일 병합 보드의 데이터 구조를 정의합니다.
 *
 * 주요 개념:
 * - FileItem: 드래그 가능한 개별 파일 (카드)
 * - FileGroup: 파일들을 담는 그룹 (컬럼)
 * - GroupMap: 모든 그룹을 관리하는 맵 구조
 *
 * 사용 위치:
 * - FileMerge.tsx: 메인 컴포넌트에서 상태 관리
 * - Card.tsx: 개별 파일 카드 렌더링
 * - Column.tsx: 그룹(컬럼) 렌더링
 */

import type { ParsedDataDto } from '../../../../types/DataDto.dto.ts'

// ============================================
// 타입 정의
// ============================================

/**
 * FileItem - 개별 파일 항목
 *
 * 드래그 앤 드롭으로 이동 가능한 개별 파일을 나타냅니다.
 * 각 파일은 고유한 ID를 가지며, 그룹 간 이동이 가능합니다.
 *
 * @example
 * const file: FileItem = {
 *   fileId: "file-1",
 *   fileName: "주문내역서.xlsx",
 *   itemCount: "100개 항목"
 * }
 */
export type FileItem = {
  /** 파일 고유 ID (예: "file-1", "file-2") */
  fileId: string
  /** 파일명 (예: "주문내역서.xlsx") */
  fileName: string
  /** 파일 내 데이터 개수 표시 (예: "100개 항목") */
  itemCount: string
}

/**
 * FileGroup - 파일 그룹
 *
 * 여러 파일을 담을 수 있는 컨테이너 역할을 합니다.
 * 드래그 앤 드롭 보드에서 "컬럼"에 해당하며,
 * 사용자가 파일을 분류하기 위해 여러 그룹을 생성할 수 있습니다.
 *
 * @example
 * const group: FileGroup = {
 *   groupId: "group-1",
 *   groupTitle: "업로드된 파일",
 *   files: [file1, file2, file3]
 * }
 */
export type FileGroup = {
  /** 그룹 고유 ID (예: "group-1", "group-1234567890") */
  groupId: string
  /** 그룹 제목 (사용자가 편집 가능, 예: "업로드된 파일", "병합할 파일") */
  groupTitle: string
  /** 그룹에 속한 파일 목록 (드래그 앤 드롭으로 추가/제거 가능) */
  files: FileItem[]
}

/**
 * GroupMap - 그룹 맵
 *
 * 모든 그룹을 효율적으로 관리하기 위한 맵 구조입니다.
 * groupId를 키로 사용하여 O(1) 시간에 그룹에 접근할 수 있습니다.
 *
 * @example
 * const groupMap: GroupMap = {
 *   "group-1": { groupId: "group-1", groupTitle: "업로드된 파일", files: [...] },
 *   "group-2": { groupId: "group-2", groupTitle: "병합할 파일", files: [...] }
 * }
 */
export type GroupMap = {
  [groupId: string]: FileGroup
}

/**
 * BoardDataSet - 보드 데이터 셋
 *
 * 전체 드래그 앤 드롭 보드의 상태를 나타냅니다.
 * groupMap과 orderedGroupIds를 함께 사용하여
 * 그룹의 데이터와 순서를 동시에 관리합니다.
 *
 * 왜 orderedGroupIds가 필요한가?
 * - JavaScript 객체(Object)의 키 순서는 보장되지 않음
 * - 사용자가 드래그로 변경한 그룹 순서를 정확히 유지하기 위함
 *
 * @example
 * const boardData: BoardDataSet = {
 *   groupMap: {
 *     "group-1": {...},
 *     "group-2": {...}
 *   },
 *   orderedGroupIds: ["group-1", "group-2"] // 이 순서대로 화면에 렌더링됨
 * }
 */
type BoardDataSet = {
  /** 모든 그룹의 맵 (groupId -> FileGroup) */
  groupMap: GroupMap
  /** 그룹의 순서를 나타내는 ID 배열 (화면에 표시되는 순서) */
  orderedGroupIds: string[]
}

// ============================================
// 헬퍼 함수
// ============================================

/**
 * getBasicData - 초기 보드 데이터 생성
 *
 * 업로드된 파일 데이터(parsedData)를 받아서
 * 드래그 앤 드롭 보드의 초기 상태를 생성합니다.
 *
 * 동작 방식:
 * 1. parsedData를 FileItem 형식으로 변환
 * 2. "업로드된 파일"이라는 기본 그룹(group-1) 생성
 * 3. 모든 파일을 이 기본 그룹에 배치
 *
 * 사용 시점:
 * - FileMerge 컴포넌트가 처음 마운트될 때
 * - parsedData가 변경되었을 때 (새 파일 업로드)
 *
 * @param parsedData - DataStore에서 관리하는 업로드된 파일의 파싱 데이터
 * @returns 초기 보드 상태 (group-1에 모든 파일이 담긴 상태)
 *
 * @example
 * const parsedData = [
 *   { id: 1, name: "file1.xlsx", data: [{...}, {...}] },
 *   { id: 2, name: "file2.xlsx", data: [{...}] }
 * ]
 *
 * const initialBoard = getBasicData(parsedData)
 * // 결과:
 * // {
 * //   groupMap: {
 * //     "group-1": {
 * //       groupId: "group-1",
 * //       groupTitle: "업로드된 파일",
 * //       files: [
 * //         { fileId: "file-1", fileName: "file1.xlsx", itemCount: "2개 항목" },
 * //         { fileId: "file-2", fileName: "file2.xlsx", itemCount: "1개 항목" }
 * //       ]
 * //     }
 * //   },
 * //   orderedGroupIds: ["group-1"]
 * // }
 */
export function getBasicData(parsedData: ParsedDataDto[]): BoardDataSet {
  // Step 1: parsedData를 FileItem 타입으로 변환
  // - fileId: "file-{id}" 형식으로 고유 ID 생성
  // - fileName: 원본 파일명 사용
  // - itemCount: 파일 내 데이터 행 개수를 "N개 항목" 형식으로 표시
  const uploadedFiles: FileItem[] = parsedData.map(data => ({
    fileId: `file-${data.id}`,
    fileName: data.name,
    itemCount: `${data.data.length}개 항목`,
  }))

  // Step 2: 초기 보드 상태 생성
  // - 기본 그룹 "group-1" (업로드된 파일) 생성
  // - 모든 파일을 이 그룹에 배치
  return {
    groupMap: {
      'group-1': {
        groupId: 'group-1',
        groupTitle: '업로드된 파일',
        files: uploadedFiles,
      },
    },
    orderedGroupIds: ['group-1'], // 초기에는 group-1만 존재
  }
}
