import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import CheckIcon from '@mui/icons-material/Check'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { Box, IconButton, Paper, TextField, Typography } from '@mui/material'
import { useContext, useEffect, useRef, useState } from 'react'
import type { FileGroup } from '../data/FileData.ts'
import { BoardContext } from './BoardContext.tsx'
import { Card } from './Card.tsx'

type GroupColumnProps = {
  group: FileGroup
  onUpdateTitle?: (groupId: string, newTitle: string) => void
  onDeleteGroup?: (groupId: string) => void
}

/**
 * 파일 그룹 컴포넌트 (드래그 앤 드롭 컬럼)
 * - 여러 파일을 담을 수 있는 드래그 가능한 그룹 컨테이너
 */
export function Column({
  group,
  onUpdateTitle,
  onDeleteGroup,
}: GroupColumnProps) {
  const boardContext = useContext(BoardContext)
  const groupRef = useRef<HTMLDivElement | null>(null)
  const headerRef = useRef<HTMLDivElement | null>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState(group.groupTitle)

  useEffect(() => {
    const groupEl = groupRef.current
    const headerEl = headerRef.current

    if (!groupEl || !headerEl || !boardContext) {
      return
    }

    return combine(
      // 그룹 등록
      boardContext.registerGroup({
        groupId: group.groupId,
        entry: { element: groupEl },
      }),
      // 드래그 가능하게 설정 (헤더를 드래그 핸들로)
      draggable({
        element: headerEl,
        getInitialData: () => ({
          groupId: group.groupId,
          type: 'group',
          instanceId: boardContext.instanceId,
        }),
      }),
      // 드롭 타겟으로 설정 (파일과 그룹 모두 받을 수 있음)
      dropTargetForElements({
        element: groupEl,
        getData: () => ({ groupId: group.groupId }),
        canDrop: ({ source }) => {
          return (
            source.data.instanceId === boardContext.instanceId &&
            (source.data.type === 'file' || source.data.type === 'group')
          )
        },
        onDragEnter: () => setIsDraggingOver(true),
        onDragLeave: () => setIsDraggingOver(false),
        onDrop: () => setIsDraggingOver(false),
      }),
    )
  }, [group.groupId, boardContext])

  const handleSaveTitle = () => {
    if (onUpdateTitle && editedTitle.trim()) {
      onUpdateTitle(group.groupId, editedTitle.trim())
    }
    setIsEditingTitle(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle()
    } else if (e.key === 'Escape') {
      setEditedTitle(group.groupTitle)
      setIsEditingTitle(false)
    }
  }

  const handleDeleteGroup = () => {
    if (onDeleteGroup) {
      if (group.files.length > 0) {
        const confirm = window.confirm(
          `"${group.groupTitle}" 그룹에 ${group.files.length}개의 파일이 있습니다.\n그룹을 삭제하면 파일들이 "업로드된 파일" 그룹으로 이동됩니다.\n계속하시겠습니까?`,
        )
        if (!confirm) return
      }
      onDeleteGroup(group.groupId)
    }
  }

  return (
    <Paper
      ref={groupRef}
      elevation={isDraggingOver ? 8 : 2}
      sx={{
        minWidth: '300px',
        maxWidth: '300px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: isDraggingOver ? '#e3f2fd' : 'white',
        transition: 'all 0.2s',
      }}
    >
      <Box
        ref={headerRef}
        sx={{
          padding: '16px',
          borderBottom: '1px solid #e0e0e0',
          cursor: 'grab',
          '&:active': {
            cursor: 'grabbing',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {isEditingTitle ? (
            <>
              <TextField
                size="small"
                value={editedTitle}
                onChange={e => setEditedTitle(e.target.value)}
                onKeyDown={handleKeyPress}
                autoFocus
                sx={{ flex: 1 }}
              />
              <IconButton size="small" onClick={handleSaveTitle}>
                <CheckIcon fontSize="small" />
              </IconButton>
            </>
          ) : (
            <>
              <Typography variant="h6" sx={{ fontWeight: 'bold', flex: 1 }}>
                {group.groupTitle}
              </Typography>
              {onUpdateTitle && (
                <IconButton
                  size="small"
                  onClick={() => setIsEditingTitle(true)}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              )}
              {onDeleteGroup && (
                <IconButton
                  size="small"
                  onClick={handleDeleteGroup}
                  color="error"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </>
          )}
        </Box>
        <Typography variant="caption" color="text.secondary">
          {group.files.length}개 항목
        </Typography>
      </Box>
      <Box
        sx={{
          padding: '8px',
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {group.files.map(file => (
          <Card key={file.fileId} file={file} groupId={group.groupId} />
        ))}
      </Box>
    </Paper>
  )
}
