/**
 * ============================================
 * Board.tsx - 드래그 앤 드롭 보드 컨테이너
 * ============================================
 *
 * 이 파일은 드래그 앤 드롭 보드의 최상위 컨테이너 컴포넌트입니다.
 * 모든 그룹(Column)을 감싸는 레이아웃을 제공합니다.
 *
 * 역할:
 * - Flexbox 레이아웃으로 그룹들을 가로로 배치
 * - 그룹 간 간격 설정 (gap: 16px)
 * - 전체 보드의 배경색과 스타일 정의
 *
 * 사용 위치:
 * - FileMerge.tsx: <Board> 안에 Column 컴포넌트들을 렌더링
 *
 * @example
 * <Board>
 *   <Column group={group1} />
 *   <Column group={group2} />
 *   <Button>+ 그룹 추가</Button>
 * </Board>
 */

import { Box } from '@mui/material'
import type { ReactNode } from 'react'

// ============================================
// 타입 정의
// ============================================

/**
 * BoardProps - Board 컴포넌트의 Props
 *
 * @property children - 보드 내부에 렌더링될 컴포넌트들
 *                      일반적으로 Column 컴포넌트들과 "그룹 추가" 버튼
 */
type BoardProps = {
  /** 보드 내부에 렌더링될 자식 요소들 (Column 컴포넌트들) */
  children: ReactNode
}

// ============================================
// 컴포넌트
// ============================================

/**
 * Board - 드래그 앤 드롭 보드 컨테이너
 *
 * 모든 그룹(컬럼)을 가로로 배치하는 Flexbox 컨테이너입니다.
 * Material-UI의 Box 컴포넌트를 사용하여 스타일을 적용합니다.
 *
 * 레이아웃 전략:
 * - 한 행에 최대 3개의 그룹까지 배치
 * - 3개 초과 시 자동으로 다음 줄로 넘어감 (flexWrap: 'wrap')
 * - 각 그룹은 일정한 너비 유지 (300px)
 *
 * 스타일 설명:
 * - display: 'flex': 자식 요소들을 가로로 배치
 * - flexWrap: 'wrap': 한 줄에 다 들어가지 않으면 다음 줄로 넘김
 * - gap: '16px': 그룹 간 간격 (16px)
 * - padding: '16px': 보드 내부 여백
 * - backgroundColor: '#f5f5f5': 연한 회색 배경 (Trello 스타일)
 * - borderRadius: '8px': 모서리 둥글게
 * - minHeight: '400px': 최소 높이 (내용이 적어도 일정 높이 유지)
 *
 * 왜 minHeight가 필요한가?
 * - 파일이 없어도 그룹을 드롭할 수 있는 영역 확보
 * - 시각적으로 안정적인 레이아웃 제공
 *
 * 한 행에 3개 제한 계산:
 * - 보드 너비를 100%로 가정
 * - 그룹 너비: 300px
 * - 그룹 간격: 16px
 * - 내부 여백: 16px * 2 = 32px
 * - 필요한 최소 너비: (300 * 3) + (16 * 2) + 32 = 964px
 *
 * @param props.children - 보드 내부에 렌더링될 자식 요소들
 * @returns Flexbox 레이아웃의 보드 컨테이너
 *
 * @example
 * // FileMerge.tsx에서 사용
 * <Board>
 *   {data.orderedGroupIds.map(groupId => (
 *     <Column key={groupId} group={data.groupMap[groupId]} />
 *   ))}
 *   <Button onClick={addNewGroup}>+ 그룹 추가</Button>
 * </Board>
 */
export default function Board({ children }: BoardProps) {
  return (
    <Box
      sx={{
        // Flexbox 레이아웃: 자식 요소들을 가로로 배치
        display: 'flex',
        // flexWrap: 한 줄에 다 들어가지 않으면 다음 줄로 넘김
        // - 'wrap': 넘치면 다음 줄로 (한 행에 최대 3개 제한)
        flexWrap: 'wrap',
        // 그룹 간 간격: 16px (각 Column 사이의 간격, 가로/세로 모두)
        gap: '16px',
        // 보드 내부 여백: 16px (상하좌우)
        padding: '16px',
        // 배경색: 연한 회색 (#f5f5f5)
        backgroundColor: '#f5f5f5',
        // 모서리 둥글게: 8px
        borderRadius: '8px',
        // 최소 높이: 400px (파일이 없어도 일정 높이 유지)
        minHeight: '400px',
      }}
    >
      {children}
    </Box>
  )
}
