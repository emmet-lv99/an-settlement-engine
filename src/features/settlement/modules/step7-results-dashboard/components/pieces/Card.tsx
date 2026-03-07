/**
 * ============================================
 * Card.tsx - 파일 카드 컴포넌트
 * ============================================
 *
 * 이 파일은 드래그 가능한 개별 파일 카드 컴포넌트입니다.
 * Atlaskit의 pragmatic-drag-and-drop 라이브러리를 사용하여
 * 드래그 앤 드롭 기능을 구현합니다.
 *
 * 주요 기능:
 * 1. 드래그 가능 (draggable): 파일 카드를 마우스로 드래그
 * 2. 드롭 타겟 (dropTargetForElements): 다른 파일을 이 카드 위/아래로 드롭
 * 3. DOM 등록 (registerFile): 애니메이션과 포커스 복원을 위한 DOM 요소 등록
 * 4. 시각적 피드백: 드래그 중 투명도 변경, 드롭 가능 영역 표시
 *
 * 사용 위치:
 * - Column.tsx: 각 그룹의 파일 목록을 Card로 렌더링
 *
 * 외부 라이브러리:
 * - @atlaskit/pragmatic-drag-and-drop: Atlassian의 드래그 앤 드롭 라이브러리
 * - @mui/material: Material-UI 컴포넌트
 */

import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import {
  Box,
  CardContent,
  IconButton,
  Card as MuiCard,
  Typography,
} from '@mui/material'
import { useContext, useEffect, useRef, useState } from 'react'
import type { FileItem } from '../data/FileData.ts'
import { BoardContext } from './BoardContext.tsx'

// ============================================
// 타입 정의
// ============================================

/**
 * FileCardProps - 파일 카드 컴포넌트의 Props
 *
 * @property file - 표시할 파일 정보 (FileItem)
 * @property groupId - 이 파일이 속한 그룹 ID
 */
type FileCardProps = {
  /** 표시할 파일 정보 (fileId, fileName, itemCount) */
  file: FileItem
  /** 이 파일이 속한 그룹 ID (드래그 시작 위치 식별용) */
  groupId: string
}

// ============================================
// 컴포넌트
// ============================================

/**
 * Card - 파일 카드 컴포넌트
 *
 * 드래그 가능한 파일 카드를 렌더링합니다.
 * 사용자는 드래그 핸들(≡ 아이콘)을 잡고 파일을 이동할 수 있습니다.
 *
 * 동작 흐름:
 * 1. 컴포넌트 마운트 → useEffect 실행
 * 2. DOM 요소 등록 (registerFile)
 * 3. 드래그 가능 설정 (draggable)
 * 4. 드롭 타겟 설정 (dropTargetForElements)
 * 5. 사용자가 드래그 시작 → isDragging = true → 투명도 50%
 * 6. 다른 카드 위로 드래그 → isDraggingOver = true → 상단에 파란색 선 표시
 * 7. 드롭 완료 → FileMerge.tsx에서 상태 업데이트
 * 8. 컴포넌트 언마운트 → cleanup 함수로 자동 정리
 *
 * @param props.file - 표시할 파일 정보
 * @param props.groupId - 이 파일이 속한 그룹 ID
 * @returns 드래그 가능한 파일 카드 UI
 */
export function Card({ file, groupId }: FileCardProps) {
  // ========================================
  // Context & Refs
  // ========================================

  /**
   * boardContext - 보드 컨텍스트
   * registerFile, instanceId 등 보드 관련 함수와 데이터에 접근
   */
  const boardContext = useContext(BoardContext)

  /**
   * cardRef - 카드 전체 DOM 요소 참조
   * - 드래그 가능한 요소로 설정
   * - 애니메이션 효과 적용 대상
   */
  const cardRef = useRef<HTMLDivElement | null>(null)

  /**
   * dragHandleRef - 드래그 핸들 버튼 DOM 요소 참조
   * - 사용자가 잡고 드래그하는 부분 (≡ 아이콘)
   * - 포커스 복원 대상
   */
  const dragHandleRef = useRef<HTMLButtonElement | null>(null)

  // ========================================
  // State
  // ========================================

  /**
   * isDragging - 현재 이 카드가 드래그 중인지 여부
   * true일 때: 투명도 50%, elevation 8 (그림자 강조)
   */
  const [isDragging, setIsDragging] = useState(false)

  /**
   * isDraggingOver - 다른 카드가 이 카드 위로 드래그 중인지 여부
   * true일 때: 상단에 파란색 선 표시 (드롭 가능 영역 시각화)
   */
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  // ========================================
  // Effects
  // ========================================

  /**
   * 드래그 앤 드롭 설정 useEffect
   *
   * 이 useEffect는 세 가지 작업을 수행합니다:
   * 1. registerFile: DOM 요소를 레지스트리에 등록
   * 2. draggable: 카드를 드래그 가능하게 설정
   * 3. dropTargetForElements: 카드를 드롭 타겟으로 설정
   *
   * combine 함수를 사용하는 이유:
   * - 여러 cleanup 함수를 하나로 합쳐서 반환
   * - useEffect의 return에서 한 번에 정리 가능
   */
  useEffect(() => {
    const cardEl = cardRef.current
    const dragHandleEl = dragHandleRef.current

    // DOM 요소가 준비되지 않았거나 Context가 없으면 early return
    if (!cardEl || !dragHandleEl || !boardContext) {
      return
    }

    return combine(
      // ========================================
      // 1. DOM 요소 레지스트리 등록
      // ========================================
      /**
       * registerFile - 파일 카드 DOM 등록
       *
       * 드래그 완료 후 애니메이션(triggerPostMoveFlash)과
       * 포커스 복원을 위해 DOM 요소를 레지스트리에 등록합니다.
       *
       * 반환된 cleanup 함수는 컴포넌트 언마운트 시 자동 호출되어
       * 레지스트리에서 제거됩니다.
       */
      boardContext.registerFile({
        fileId: file.fileId,
        entry: {
          element: cardEl, // 카드 전체 요소
          actionMenuTrigger: dragHandleEl, // 드래그 핸들 버튼
        },
      }),

      // ========================================
      // 2. 드래그 가능 설정
      // ========================================
      /**
       * draggable - 카드를 드래그 가능하게 설정
       *
       * 설정:
       * - element: 드래그 가능한 요소 (카드 전체)
       * - dragHandle: 드래그를 시작할 수 있는 핸들 (≡ 아이콘 버튼)
       *   → 사용자는 핸들만 잡고 드래그 가능
       * - getInitialData: 드래그 데이터 (다른 컴포넌트에서 참조)
       *   → fileId: 어떤 파일인지 식별
       *   → groupId: 어느 그룹에서 시작했는지 식별
       *   → type: 'file' (파일인지 그룹인지 구분)
       *   → instanceId: 어떤 보드 인스턴스인지 식별 (충돌 방지)
       * - onDragStart: 드래그 시작 시 isDragging = true
       * - onDrop: 드롭 완료 시 isDragging = false
       */
      draggable({
        element: cardEl,
        dragHandle: dragHandleEl,
        getInitialData: () => ({
          fileId: file.fileId,
          groupId: groupId,
          type: 'file',
          instanceId: boardContext.instanceId,
        }),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      }),

      // ========================================
      // 3. 드롭 타겟 설정
      // ========================================
      /**
       * dropTargetForElements - 카드를 드롭 타겟으로 설정
       *
       * 다른 파일 카드를 이 카드 위/아래로 드롭할 수 있게 합니다.
       *
       * 설정:
       * - element: 드롭 타겟 요소 (카드 전체)
       * - getData: 드롭 시 전달할 데이터 (fileId)
       * - canDrop: 드롭 가능 여부 체크
       *   → 같은 보드 인스턴스인지 확인 (instanceId)
       *   → 파일 타입인지 확인 (type === 'file')
       * - onDragEnter: 다른 카드가 이 카드 위로 진입 → isDraggingOver = true
       * - onDragLeave: 다른 카드가 이 카드를 벗어남 → isDraggingOver = false
       * - onDrop: 드롭 완료 → isDraggingOver = false
       */
      dropTargetForElements({
        element: cardEl,
        getData: () => ({ fileId: file.fileId }),
        canDrop: ({ source }) => {
          return (
            source.data.instanceId === boardContext.instanceId &&
            source.data.type === 'file'
          )
        },
        onDragEnter: () => setIsDraggingOver(true),
        onDragLeave: () => setIsDraggingOver(false),
        onDrop: () => setIsDraggingOver(false),
      }),
    )
  }, [file.fileId, groupId, boardContext])

  // ========================================
  // Render
  // ========================================

  return (
    <MuiCard
      ref={cardRef}
      // elevation: 드래그 중일 때 그림자 강조 (1 → 8)
      elevation={isDragging ? 8 : 1}
      sx={{
        // opacity: 드래그 중일 때 투명하게 (1 → 0.5)
        opacity: isDragging ? 0.5 : 1,
        // borderTop: 다른 카드가 위로 드래그 중일 때 파란색 선 표시
        borderTop: isDraggingOver ? '2px solid #1976d2' : 'none',
        // transition: 부드러운 애니메이션
        transition: 'all 0.2s',
        // cursor: 마우스 커서를 손 모양으로
        cursor: 'grab',
        // active 상태 (클릭 중): 잡는 손 모양으로
        '&:active': {
          cursor: 'grabbing',
        },
      }}
    >
      <CardContent sx={{ padding: '12px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* 드래그 핸들 버튼 (≡ 아이콘) */}
          <IconButton ref={dragHandleRef} size="small" sx={{ padding: '4px' }}>
            <DragIndicatorIcon fontSize="small" />
          </IconButton>

          {/* 파일 정보 */}
          <Box sx={{ flex: 1 }}>
            {/* 파일명 */}
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {file.fileName}
            </Typography>
            {/* 데이터 개수 */}
            <Typography variant="caption" color="text.secondary">
              {file.itemCount}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </MuiCard>
  )
}
