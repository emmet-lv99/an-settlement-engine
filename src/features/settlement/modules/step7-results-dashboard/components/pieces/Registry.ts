/**
 * ============================================
 * Registry.ts - DOM 요소 레지스트리
 * ============================================
 *
 * 이 파일은 드래그 앤 드롭되는 파일 카드와 그룹의
 * DOM 요소를 등록하고 관리하는 레지스트리를 제공합니다.
 *
 * 왜 레지스트리가 필요한가?
 * - 드래그 완료 후 애니메이션 효과 적용 (triggerPostMoveFlash)
 * - 드래그 완료 후 포커스 복원 (접근성)
 * - ID만으로 실제 DOM 요소에 빠르게 접근 (O(1))
 *
 * 동작 방식:
 * 1. 컴포넌트 마운트 시: registerFile/registerGroup 호출 → Map에 저장
 * 2. 드래그 완료 시: getFile/getGroup으로 DOM 요소 조회 → 애니메이션/포커스 적용
 * 3. 컴포넌트 언마운트 시: 반환된 cleanup 함수 호출 → Map에서 삭제
 *
 * 사용 위치:
 * - FileMerge.tsx: createRegistry()로 레지스트리 인스턴스 생성
 * - Card.tsx: registerFile()로 파일 카드 DOM 등록
 * - Column.tsx: registerGroup()로 그룹 DOM 등록
 */

// ============================================
// 타입 정의
// ============================================

/**
 * FileEntry - 파일 카드 레지스트리 엔트리
 *
 * 드래그 가능한 파일 카드의 DOM 요소 정보를 담습니다.
 * 두 개의 DOM 요소를 저장합니다:
 * - element: 카드 전체 요소 (애니메이션 적용)
 * - actionMenuTrigger: 드래그 핸들 버튼 (포커스 복원)
 */
type FileEntry = {
  /** 파일 카드 전체 DOM 요소 (MuiCard 컴포넌트) */
  element: HTMLElement
  /** 드래그 핸들 버튼 DOM 요소 (IconButton 컴포넌트) */
  actionMenuTrigger: HTMLElement
}

/**
 * GroupEntry - 그룹 레지스트리 엔트리
 *
 * 드래그 가능한 그룹(컬럼)의 DOM 요소 정보를 담습니다.
 */
type GroupEntry = {
  /** 그룹 전체 DOM 요소 (Paper 컴포넌트) */
  element: HTMLElement
}

// ============================================
// 레지스트리 팩토리 함수
// ============================================

/**
 * createRegistry - 레지스트리 생성 함수
 *
 * 파일 카드와 그룹의 DOM 요소를 관리하는 레지스트리를 생성합니다.
 * Map 자료구조를 사용하여 O(1) 시간에 DOM 요소에 접근할 수 있습니다.
 *
 * 왜 팩토리 패턴을 사용하는가?
 * - 각 보드 인스턴스마다 독립적인 레지스트리 필요
 * - private 변수(files, groups) 캡슐화
 * - 클로저를 통해 외부에서 직접 접근 방지
 *
 * @returns 레지스트리 객체 (registerFile, getFile, registerGroup, getGroup 메서드 포함)
 *
 * @example
 * const registry = createRegistry()
 *
 * // 파일 카드 등록
 * const cleanup = registry.registerFile({
 *   fileId: "file-1",
 *   entry: { element: cardEl, actionMenuTrigger: handleEl }
 * })
 *
 * // 나중에 DOM 요소 조회
 * const fileEntry = registry.getFile("file-1")
 * triggerPostMoveFlash(fileEntry.element)
 *
 * // 언마운트 시 정리
 * cleanup()
 */
export function createRegistry() {
  // ========================================
  // Private 변수
  // ========================================

  /**
   * files - 파일 카드 레지스트리
   *
   * fileId를 키로, FileEntry를 값으로 저장하는 Map
   *
   * @example
   * files = Map {
   *   "file-1" => { element: <div>, actionMenuTrigger: <button> },
   *   "file-2" => { element: <div>, actionMenuTrigger: <button> }
   * }
   */
  const files: Map<string, FileEntry> = new Map()

  /**
   * groups - 그룹 레지스트리
   *
   * groupId를 키로, GroupEntry를 값으로 저장하는 Map
   *
   * @example
   * groups = Map {
   *   "group-1" => { element: <div> },
   *   "group-2" => { element: <div> }
   * }
   */
  const groups: Map<string, GroupEntry> = new Map()

  // ========================================
  // Public 메서드
  // ========================================

  return {
    /**
     * registerFile - 파일 카드 등록
     *
     * 파일 카드의 DOM 요소를 레지스트리에 등록합니다.
     * 등록 해제 함수(cleanup)를 반환하여 컴포넌트 언마운트 시 자동 정리를 지원합니다.
     *
     * 호출 시점:
     * - Card 컴포넌트의 useEffect 내부
     * - cardRef.current와 dragHandleRef.current가 준비된 후
     *
     * @param fileId - 파일 고유 ID
     * @param entry - 파일 카드의 DOM 요소 정보
     * @returns cleanup 함수 (호출 시 레지스트리에서 제거)
     *
     * @example
     * // Card.tsx의 useEffect
     * useEffect(() => {
     *   const cleanup = boardContext.registerFile({
     *     fileId: file.fileId,
     *     entry: {
     *       element: cardRef.current,
     *       actionMenuTrigger: dragHandleRef.current
     *     }
     *   })
     *   return cleanup // 언마운트 시 자동 호출
     * }, [file.fileId])
     */
    registerFile: ({
      fileId,
      entry,
    }: {
      fileId: string
      entry: FileEntry
    }): (() => void) => {
      // Map에 등록
      files.set(fileId, entry)

      // cleanup 함수 반환 (클로저로 fileId 캡처)
      return () => {
        files.delete(fileId)
      }
    },

    /**
     * getFile - 파일 카드 조회
     *
     * fileId로 등록된 파일 카드의 DOM 요소를 조회합니다.
     * 등록되지 않은 ID로 조회 시 에러를 throw합니다.
     *
     * 호출 시점:
     * - 드래그 완료 후 (FileMerge.tsx의 useEffect)
     * - triggerPostMoveFlash 애니메이션 적용 전
     * - 포커스 복원 전
     *
     * @param fileId - 파일 고유 ID
     * @returns 파일 카드의 DOM 요소 정보
     * @throws {Error} 파일이 레지스트리에 없을 경우
     *
     * @example
     * // FileMerge.tsx에서 드래그 완료 후
     * const file = destinationGroup.files[fileIndex]
     * const entry = registry.getFile(file.fileId)
     * triggerPostMoveFlash(entry.element) // 애니메이션 효과
     * entry.actionMenuTrigger.focus() // 포커스 복원
     */
    getFile: (fileId: string): FileEntry => {
      const entry = files.get(fileId)
      if (!entry) {
        // 개발 중 버그 발견을 위한 명시적 에러
        throw new Error(`File with id ${fileId} not found in registry`)
      }
      return entry
    },

    /**
     * registerGroup - 그룹 등록
     *
     * 그룹(컬럼)의 DOM 요소를 레지스트리에 등록합니다.
     * 등록 해제 함수(cleanup)를 반환하여 컴포넌트 언마운트 시 자동 정리를 지원합니다.
     *
     * 호출 시점:
     * - Column 컴포넌트의 useEffect 내부
     * - groupRef.current가 준비된 후
     *
     * @param groupId - 그룹 고유 ID
     * @param entry - 그룹의 DOM 요소 정보
     * @returns cleanup 함수 (호출 시 레지스트리에서 제거)
     *
     * @example
     * // Column.tsx의 useEffect
     * useEffect(() => {
     *   const cleanup = boardContext.registerGroup({
     *     groupId: group.groupId,
     *     entry: {
     *       element: groupRef.current
     *     }
     *   })
     *   return cleanup // 언마운트 시 자동 호출
     * }, [group.groupId])
     */
    registerGroup: ({
      groupId,
      entry,
    }: {
      groupId: string
      entry: GroupEntry
    }): (() => void) => {
      // Map에 등록
      groups.set(groupId, entry)

      // cleanup 함수 반환 (클로저로 groupId 캡처)
      return () => {
        groups.delete(groupId)
      }
    },

    /**
     * getGroup - 그룹 조회
     *
     * groupId로 등록된 그룹의 DOM 요소를 조회합니다.
     * 등록되지 않은 ID로 조회 시 에러를 throw합니다.
     *
     * 호출 시점:
     * - 그룹 순서 변경 완료 후 (FileMerge.tsx의 useEffect)
     * - triggerPostMoveFlash 애니메이션 적용 전
     *
     * @param groupId - 그룹 고유 ID
     * @returns 그룹의 DOM 요소 정보
     * @throws {Error} 그룹이 레지스트리에 없을 경우
     *
     * @example
     * // FileMerge.tsx에서 그룹 순서 변경 완료 후
     * const sourceGroup = groupMap[orderedGroupIds[finishIndex]]
     * const entry = registry.getGroup(sourceGroup.groupId)
     * triggerPostMoveFlash(entry.element) // 애니메이션 효과
     */
    getGroup: (groupId: string): GroupEntry => {
      const entry = groups.get(groupId)
      if (!entry) {
        // 개발 중 버그 발견을 위한 명시적 에러
        throw new Error(`Group with id ${groupId} not found in registry`)
      }
      return entry
    },
  }
}
