/**
 * ============================================
 * BoardContext.tsx - 드래그 앤 드롭 보드 컨텍스트
 * ============================================
 *
 * 이 파일은 React Context API를 사용하여
 * 드래그 앤 드롭 보드의 상태와 동작을 하위 컴포넌트에 전달합니다.
 *
 * 왜 Context를 사용하는가?
 * - Column, Card 컴포넌트가 깊은 계층 구조에 있음
 * - Props Drilling을 피하고 싶음
 * - 모든 하위 컴포넌트가 동일한 보드 인스턴스에 접근해야 함
 *
 * 사용 위치:
 * - FileMerge.tsx: Context Provider로 값 제공
 * - Column.tsx: useContext로 그룹 관련 함수 사용
 * - Card.tsx: useContext로 파일 관련 함수 사용
 */

import { createContext } from 'react'
import type { FileGroup } from '../data/FileData.ts'

/**
 * BoardContextValue - 보드 컨텍스트 값 타입
 *
 * 드래그 앤 드롭 보드의 모든 동작을 정의하는 인터페이스입니다.
 * 이 인터페이스를 통해 하위 컴포넌트는 보드의 상태를 변경할 수 있습니다.
 *
 * 주요 기능 그룹:
 * 1. 데이터 조회: getGroups
 * 2. 그룹 관리: reorderGroup
 * 3. 파일 관리: reorderFile, moveFile
 * 4. DOM 등록: registerFile, registerGroup
 * 5. 인스턴스 식별: instanceId
 */
export type BoardContextValue = {
  /**
   * getGroups - 모든 그룹 가져오기
   *
   * 현재 보드에 있는 모든 그룹을 순서대로 반환합니다.
   * orderedGroupIds 순서에 따라 정렬된 배열을 반환합니다.
   *
   * @returns 순서가 보장된 FileGroup 배열
   *
   * @example
   * const groups = boardContext.getGroups()
   * // [
   * //   { groupId: "group-1", groupTitle: "업로드된 파일", files: [...] },
   * //   { groupId: "group-2", groupTitle: "병합할 파일", files: [...] }
   * // ]
   */
  getGroups: () => FileGroup[]

  /**
   * reorderGroup - 그룹 순서 변경
   *
   * 그룹(컬럼)의 순서를 변경합니다.
   * 사용자가 그룹 헤더를 드래그하여 좌우로 이동할 때 호출됩니다.
   *
   * @param args.startIndex - 원래 위치 인덱스 (0부터 시작)
   * @param args.finishIndex - 이동할 위치 인덱스 (0부터 시작)
   * @param args.trigger - 트리거 방식 ('pointer': 마우스, 'keyboard': 키보드)
   *
   * @example
   * // group-1을 첫 번째에서 두 번째 위치로 이동
   * boardContext.reorderGroup({
   *   startIndex: 0,
   *   finishIndex: 1,
   *   trigger: 'pointer'
   * })
   */
  reorderGroup: (args: {
    startIndex: number
    finishIndex: number
    trigger?: 'pointer' | 'keyboard'
  }) => void

  /**
   * reorderFile - 같은 그룹 내에서 파일 순서 변경
   *
   * 동일한 그룹 내에서 파일의 순서를 변경합니다.
   * 사용자가 파일 카드를 같은 그룹 내에서 위아래로 드래그할 때 호출됩니다.
   *
   * @param args.groupId - 그룹 ID
   * @param args.startIndex - 파일의 원래 위치 인덱스
   * @param args.finishIndex - 파일이 이동할 위치 인덱스
   * @param args.trigger - 트리거 방식
   *
   * @example
   * // "group-1" 내에서 첫 번째 파일을 세 번째 위치로 이동
   * boardContext.reorderFile({
   *   groupId: "group-1",
   *   startIndex: 0,
   *   finishIndex: 2,
   *   trigger: 'pointer'
   * })
   */
  reorderFile: (args: {
    groupId: string
    startIndex: number
    finishIndex: number
    trigger?: 'pointer' | 'keyboard'
  }) => void

  /**
   * moveFile - 다른 그룹으로 파일 이동
   *
   * 파일을 한 그룹에서 다른 그룹으로 이동합니다.
   * 사용자가 파일 카드를 다른 그룹으로 드래그할 때 호출됩니다.
   *
   * @param args.startGroupId - 출발 그룹 ID
   * @param args.finishGroupId - 도착 그룹 ID
   * @param args.fileIndexInStartGroup - 출발 그룹에서의 파일 인덱스
   * @param args.fileIndexInFinishGroup - 도착 그룹에서 삽입될 위치 (생략 시 맨 앞)
   * @param args.trigger - 트리거 방식
   *
   * @example
   * // "group-1"의 첫 번째 파일을 "group-2"의 두 번째 위치로 이동
   * boardContext.moveFile({
   *   startGroupId: "group-1",
   *   finishGroupId: "group-2",
   *   fileIndexInStartGroup: 0,
   *   fileIndexInFinishGroup: 1,
   *   trigger: 'pointer'
   * })
   */
  moveFile: (args: {
    startGroupId: string
    finishGroupId: string
    fileIndexInStartGroup: number
    fileIndexInFinishGroup?: number
    trigger?: 'pointer' | 'keyboard'
  }) => void

  /**
   * registerFile - 파일 카드 DOM 등록
   *
   * 드래그 가능한 파일 카드의 DOM 요소를 레지스트리에 등록합니다.
   * Atlaskit의 pragmatic-drag-and-drop 라이브러리가
   * 드래그 완료 후 포커스를 복원하기 위해 DOM 요소 참조가 필요합니다.
   *
   * 왜 필요한가?
   * - 드래그 완료 후 원래 요소로 포커스 복원 (접근성)
   * - 드래그 애니메이션 효과 적용 (triggerPostMoveFlash)
   *
   * @param args.fileId - 파일 고유 ID
   * @param args.entry.element - 파일 카드 전체 DOM 요소
   * @param args.entry.actionMenuTrigger - 드래그 핸들 버튼 DOM 요소
   * @returns 등록 해제 함수 (컴포넌트 언마운트 시 호출)
   *
   * @example
   * const cleanup = boardContext.registerFile({
   *   fileId: "file-1",
   *   entry: {
   *     element: cardRef.current,
   *     actionMenuTrigger: dragHandleRef.current
   *   }
   * })
   * // 언마운트 시: cleanup()
   */
  registerFile: (args: {
    fileId: string
    entry: {
      element: HTMLElement
      actionMenuTrigger: HTMLElement
    }
  }) => () => void

  /**
   * registerGroup - 그룹(컬럼) DOM 등록
   *
   * 드래그 가능한 그룹(컬럼)의 DOM 요소를 레지스트리에 등록합니다.
   * 그룹 순서 변경 후 애니메이션 효과를 적용하기 위해 필요합니다.
   *
   * @param args.groupId - 그룹 고유 ID
   * @param args.entry.element - 그룹 전체 DOM 요소
   * @returns 등록 해제 함수 (컴포넌트 언마운트 시 호출)
   *
   * @example
   * const cleanup = boardContext.registerGroup({
   *   groupId: "group-1",
   *   entry: {
   *     element: groupRef.current
   *   }
   * })
   * // 언마운트 시: cleanup()
   */
  registerGroup: (args: {
    groupId: string
    entry: {
      element: HTMLElement
    }
  }) => () => void

  /**
   * instanceId - 보드 인스턴스 고유 ID
   *
   * 각 보드 인스턴스를 고유하게 식별하기 위한 Symbol입니다.
   *
   * 왜 필요한가?
   * - 한 화면에 여러 드래그 앤 드롭 보드가 있을 수 있음
   * - 다른 보드의 드래그 이벤트와 충돌하지 않도록 격리
   * - Symbol은 항상 고유한 값을 보장
   *
   * 사용 위치:
   * - 드래그 시작 시 instanceId를 드래그 데이터에 포함
   * - 드롭 가능 여부 체크 시 instanceId 비교
   *
   * @example
   * // 드래그 데이터에 instanceId 포함
   * draggable({
   *   getInitialData: () => ({
   *     fileId: "file-1",
   *     instanceId: boardContext.instanceId
   *   })
   * })
   *
   * // 드롭 가능 여부 체크
   * dropTargetForElements({
   *   canDrop: ({ source }) => {
   *     return source.data.instanceId === boardContext.instanceId
   *   }
   * })
   */
  instanceId: symbol
}

/**
 * BoardContext - 보드 컨텍스트 객체
 *
 * React Context API로 생성된 컨텍스트 객체입니다.
 * 초기값은 null이며, FileMerge 컴포넌트에서 실제 값을 제공합니다.
 *
 * 사용 방법:
 * ```tsx
 * // Provider (FileMerge.tsx)
 * <BoardContext.Provider value={contextValue}>
 *   <Board>...</Board>
 * </BoardContext.Provider>
 *
 * // Consumer (Card.tsx, Column.tsx)
 * const boardContext = useContext(BoardContext)
 * if (!boardContext) return null // null 체크 필수!
 * ```
 */
export const BoardContext = createContext<BoardContextValue | null>(null)
