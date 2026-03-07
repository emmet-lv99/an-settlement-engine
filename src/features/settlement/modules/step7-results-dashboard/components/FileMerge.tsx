import { triggerPostMoveFlash } from '@atlaskit/pragmatic-drag-and-drop-flourish/trigger-post-move-flash'
import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/types'
import { getReorderDestinationIndex } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/get-reorder-destination-index'
import * as liveRegion from '@atlaskit/pragmatic-drag-and-drop-live-region'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { reorder } from '@atlaskit/pragmatic-drag-and-drop/reorder'
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'
import { Box, Button, CircularProgress } from '@mui/material'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import invariant from 'tiny-invariant'
import { BasicSizeTypography } from '../../../components/StyledComponent.tsx'
import useDataStore from '../../../store/DataStore.ts'
import { useMappingStore } from '../../../store/MappingStore.ts'
import { executeComparison } from '../utils/executeComparison.ts'
import {
  getBasicData,
  type FileGroup,
  type FileItem,
  type GroupMap,
} from './data/FileData.ts'
import Board from './pieces/Board.tsx'
import { BoardContext, type BoardContextValue } from './pieces/BoardContext.tsx'
import { Column } from './pieces/Column.tsx'
import { createRegistry } from './pieces/Registry.ts'

/**
 * 드래그 앤 드롭 작업 결과 타입
 */
type DragOutcome =
  | {
      type: 'group-reorder' // 그룹 순서 변경
      groupId: string
      startIndex: number
      finishIndex: number
    }
  | {
      type: 'file-reorder' // 같은 그룹 내 파일 순서 변경
      groupId: string
      startIndex: number
      finishIndex: number
    }
  | {
      type: 'file-move' // 다른 그룹으로 파일 이동
      finishGroupId: string
      fileIndexInStartGroup: number
      fileIndexInFinishGroup: number
    }

/**
 * 드래그 트리거 타입 (마우스 또는 키보드)
 */
type DragTrigger = 'pointer' | 'keyboard'

/**
 * 드래그 앤 드롭 작업
 */
type DragOperation = {
  trigger: DragTrigger
  outcome: DragOutcome
}

/**
 * 보드 상태
 */
type BoardState = {
  groupMap: GroupMap // 모든 그룹의 맵
  orderedGroupIds: string[] // 그룹 순서
  lastOperation: DragOperation | null // 마지막 작업
}

interface FileMergeProps {
  setCurrentView: (
    view: 'MODE_SELECTOR' | 'FILE_MERGE' | 'FILE_COMPARISON',
  ) => void
}

const FileMerge = ({ setCurrentView }: FileMergeProps) => {
  const { parsedData, isComparisonLoading } = useDataStore()
  const {
    step7ComparisonGroups,
    setStep7ComparisonGroups,
    updateStep7GroupTitle,
  } = useMappingStore()

  const [data, setData] = useState<BoardState>(() => {
    const base = getBasicData(parsedData)
    return {
      ...base,
      lastOperation: null,
    }
  })

  // 초기화 완료 여부 추적
  const isInitialized = useRef(false)

  // 컴포넌트 마운트 시 초기화 (복원 또는 기본 설정)
  useEffect(() => {
    // 이미 초기화되었으면 스킵
    if (isInitialized.current) return

    // console.log('🔄 FileMerge 초기화 시작')

    // 저장된 그룹이 있으면 복원
    if (step7ComparisonGroups.size > 0) {
      // console.log('  → 저장된 그룹 데이터 복원 중...', step7ComparisonGroups)

      const restoredGroupMap: GroupMap = {}
      const restoredGroupIds: string[] = []

      step7ComparisonGroups.forEach((group, groupId) => {
        // 파일명을 FileItem 형식으로 변환
        const files: FileItem[] = group.files.map(fileName => ({
          fileId: fileName,
          fileName: fileName,
          itemCount: `${parsedData.find(d => d.name === fileName)?.data.length || 0}개 항목`,
        }))

        restoredGroupMap[groupId] = {
          groupId,
          groupTitle: group.title,
          files,
        }

        restoredGroupIds.push(groupId)
      })

      setData({
        groupMap: restoredGroupMap,
        orderedGroupIds: restoredGroupIds,
        lastOperation: null,
      })

      // console.log('  ✅ 그룹 데이터 복원 완료')
    } else {
      // 저장된 그룹이 없으면 기본 group-1 생성
      // console.log('  → 기본 그룹 생성 중...')

      const base = getBasicData(parsedData)
      const uploadedFileNames = base.groupMap['group-1'].files.map(
        file => file.fileName,
      )

      setStep7ComparisonGroups(prevGroups => {
        const updatedGroups = new Map(prevGroups)
        updatedGroups.set('group-1', {
          title: base.groupMap['group-1'].groupTitle,
          files: uploadedFileNames,
        })
        return updatedGroups
      })

      // console.log('  ✅ 기본 그룹 생성 완료')
    }

    isInitialized.current = true
    // console.log('✅ FileMerge 초기화 완료')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 빈 배열: 마운트 시 한 번만 실행 (의도적으로 parsedData, step7ComparisonGroups는 초기값만 사용)

  // parsedData가 변경되면 group-1의 파일 메타데이터(itemCount)만 업데이트
  useEffect(() => {
    // 초기화 전에는 실행하지 않음
    if (!isInitialized.current) return

    // console.log('🔄 parsedData 변경 감지 - group-1 메타데이터 업데이트')

    setData(prev => {
      const currentGroup1 = prev.groupMap['group-1']
      if (!currentGroup1) return prev

      // 기존 group-1의 파일들에 대해 itemCount만 업데이트
      const updatedFiles = currentGroup1.files.map(file => {
        const fileData = parsedData.find(d => d.name === file.fileName)
        return {
          ...file,
          itemCount: fileData
            ? `${fileData.data.length}개 항목`
            : file.itemCount,
        }
      })

      return {
        ...prev,
        groupMap: {
          ...prev.groupMap,
          'group-1': {
            ...currentGroup1,
            files: updatedFiles,
          },
        },
      }
    })
  }, [parsedData])

  const stableData = useRef(data)
  useEffect(() => {
    stableData.current = data
  }, [data])

  const [registry] = useState(createRegistry)

  const { lastOperation } = data

  useEffect(() => {
    if (lastOperation === null) {
      return
    }
    const { outcome, trigger } = lastOperation

    if (outcome.type === 'group-reorder') {
      const { startIndex, finishIndex } = outcome

      const { groupMap, orderedGroupIds } = stableData.current
      const sourceGroup = groupMap[orderedGroupIds[finishIndex]]

      const entry = registry.getGroup(sourceGroup.groupId)
      triggerPostMoveFlash(entry.element)

      liveRegion.announce(
        `You've moved ${sourceGroup.groupTitle} from position ${
          startIndex + 1
        } to position ${finishIndex + 1} of ${orderedGroupIds.length}.`,
      )

      return
    }

    if (outcome.type === 'file-reorder') {
      const { groupId, startIndex, finishIndex } = outcome

      const { groupMap } = stableData.current
      const group = groupMap[groupId]
      const file = group.files[finishIndex]

      const entry = registry.getFile(file.fileId)
      triggerPostMoveFlash(entry.element)

      if (trigger !== 'keyboard') {
        return
      }

      liveRegion.announce(
        `You've moved ${file.fileName} from position ${
          startIndex + 1
        } to position ${finishIndex + 1} of ${group.files.length} in the ${
          group.groupTitle
        } group.`,
      )

      return
    }

    if (outcome.type === 'file-move') {
      const { finishGroupId, fileIndexInStartGroup, fileIndexInFinishGroup } =
        outcome

      const data = stableData.current
      const destinationGroup = data.groupMap[finishGroupId]
      const file = destinationGroup.files[fileIndexInFinishGroup]

      const finishPosition =
        typeof fileIndexInFinishGroup === 'number'
          ? fileIndexInFinishGroup + 1
          : destinationGroup.files.length

      const entry = registry.getFile(file.fileId)
      triggerPostMoveFlash(entry.element)

      if (trigger !== 'keyboard') {
        return
      }

      liveRegion.announce(
        `You've moved ${file.fileName} from position ${
          fileIndexInStartGroup + 1
        } to position ${finishPosition} in the ${
          destinationGroup.groupTitle
        } group.`,
      )

      /**
       * Because the file has moved group, it will have remounted.
       * This means we need to manually restore focus to it.
       */
      entry.actionMenuTrigger.focus()

      return
    }
  }, [lastOperation, registry])

  useEffect(() => {
    return liveRegion.cleanup()
  }, [])

  const getGroups = useCallback(() => {
    const { groupMap, orderedGroupIds } = stableData.current
    return orderedGroupIds.map(groupId => groupMap[groupId])
  }, [])

  const reorderGroup = useCallback(
    ({
      startIndex,
      finishIndex,
      trigger = 'keyboard',
    }: {
      startIndex: number
      finishIndex: number
      trigger?: DragTrigger
    }) => {
      setData(data => {
        const outcome: DragOutcome = {
          type: 'group-reorder',
          groupId: data.orderedGroupIds[startIndex],
          startIndex,
          finishIndex,
        }

        return {
          ...data,
          orderedGroupIds: reorder({
            list: data.orderedGroupIds,
            startIndex,
            finishIndex,
          }),
          lastOperation: {
            outcome,
            trigger: trigger,
          },
        }
      })
    },
    [],
  )

  const reorderFile = useCallback(
    ({
      groupId,
      startIndex,
      finishIndex,
      trigger = 'keyboard',
    }: {
      groupId: string
      startIndex: number
      finishIndex: number
      trigger?: DragTrigger
    }) => {
      setData(data => {
        const sourceGroup = data.groupMap[groupId]
        const updatedFiles = reorder({
          list: sourceGroup.files,
          startIndex,
          finishIndex,
        })

        const updatedSourceGroup: FileGroup = {
          ...sourceGroup,
          files: updatedFiles,
        }

        const updatedMap: GroupMap = {
          ...data.groupMap,
          [groupId]: updatedSourceGroup,
        }

        const outcome: DragOutcome | null = {
          type: 'file-reorder',
          groupId,
          startIndex,
          finishIndex,
        }

        return {
          ...data,
          groupMap: updatedMap,
          lastOperation: {
            trigger: trigger,
            outcome,
          },
        }
      })
    },
    [],
  )

  const moveFile = useCallback(
    ({
      startGroupId,
      finishGroupId,
      fileIndexInStartGroup,
      fileIndexInFinishGroup,
      trigger = 'keyboard',
    }: {
      startGroupId: string
      finishGroupId: string
      fileIndexInStartGroup: number
      fileIndexInFinishGroup?: number
      trigger?: 'pointer' | 'keyboard'
    }) => {
      // invalid cross group movement
      if (startGroupId === finishGroupId) {
        return
      }
      setData(data => {
        const sourceGroup = data.groupMap[startGroupId]
        const destinationGroup = data.groupMap[finishGroupId]
        const file: FileItem = sourceGroup.files[fileIndexInStartGroup]

        const destinationFiles = Array.from(destinationGroup.files)
        // Going into the first position if no index is provided
        const newIndexInDestination = fileIndexInFinishGroup ?? 0
        destinationFiles.splice(newIndexInDestination, 0, file)

        const updatedMap = {
          ...data.groupMap,
          [startGroupId]: {
            ...sourceGroup,
            files: sourceGroup.files.filter(f => f.fileId !== file.fileId),
          },
          [finishGroupId]: {
            ...destinationGroup,
            files: destinationFiles,
          },
        }

        const outcome: DragOutcome | null = {
          type: 'file-move',
          finishGroupId,
          fileIndexInStartGroup,
          fileIndexInFinishGroup: newIndexInDestination,
        }

        // MappingStore 동기화: 파일을 원본 그룹에서 제거하고 대상 그룹에 추가
        const movedFileName = file.fileName

        setStep7ComparisonGroups(prevGroups => {
          const updatedGroups = new Map(prevGroups)
          const sourceGroupInStore = updatedGroups.get(startGroupId)
          const targetGroupInStore = updatedGroups.get(finishGroupId)

          if (sourceGroupInStore && targetGroupInStore) {
            updatedGroups.set(startGroupId, {
              ...sourceGroupInStore,
              files: sourceGroupInStore.files.filter(
                fileName => fileName !== movedFileName,
              ),
            })

            // 🔧 중복 체크: 이미 대상 그룹에 있는 파일이면 추가하지 않음
            const isDuplicate = targetGroupInStore.files.includes(movedFileName)
            const newFiles = isDuplicate
              ? targetGroupInStore.files
              : [...targetGroupInStore.files, movedFileName]

            updatedGroups.set(finishGroupId, {
              ...targetGroupInStore,
              files: newFiles,
            })
            // console.log(
            //   `🔄 파일 이동: ${movedFileName} | ${startGroupId} → ${finishGroupId}${isDuplicate ? ' (중복, 스킵)' : ''}`,
            // )
          }

          return updatedGroups
        })

        return {
          ...data,
          groupMap: updatedMap,
          lastOperation: {
            outcome,
            trigger: trigger,
          },
        }
      })
    },
    [setStep7ComparisonGroups],
  )

  const [instanceId] = useState(() => Symbol('instance-id'))

  useEffect(() => {
    return combine(
      monitorForElements({
        canMonitor({ source }) {
          return source.data.instanceId === instanceId
        },
        onDrop(args) {
          const { location, source } = args
          // didn't drop on anything
          if (!location.current.dropTargets.length) {
            return
          }
          // need to handle drop

          // 1. remove element from original position
          // 2. move to new position

          if (source.data.type === 'group') {
            const startIndex: number = data.orderedGroupIds.findIndex(
              groupId => groupId === source.data.groupId,
            )

            const target = location.current.dropTargets[0]
            const indexOfTarget: number = data.orderedGroupIds.findIndex(
              id => id === target.data.groupId,
            )
            const closestEdgeOfTarget: Edge | null = extractClosestEdge(
              target.data,
            )

            const finishIndex = getReorderDestinationIndex({
              startIndex,
              indexOfTarget,
              closestEdgeOfTarget,
              axis: 'horizontal',
            })

            reorderGroup({ startIndex, finishIndex, trigger: 'pointer' })
          }
          // Dragging a file
          if (source.data.type === 'file') {
            const fileId = source.data.fileId
            const sourceId = source.data.groupId

            invariant(typeof fileId === 'string', 'fileId must be a string')
            invariant(typeof sourceId === 'string', 'groupId must be a string')

            const sourceGroup = data.groupMap[sourceId]

            if (!sourceGroup) {
              console.warn('Source group not found:', sourceId)
              return
            }

            const fileIndex = sourceGroup.files.findIndex(
              file => file.fileId === fileId,
            )

            if (location.current.dropTargets.length === 1) {
              const [destinationGroupRecord] = location.current.dropTargets
              const destinationId = destinationGroupRecord.data.groupId
              invariant(typeof destinationId === 'string')
              const destinationGroup = data.groupMap[destinationId]
              invariant(destinationGroup)

              // reordering in same group
              if (sourceGroup === destinationGroup) {
                const destinationIndex = getReorderDestinationIndex({
                  startIndex: fileIndex,
                  indexOfTarget: sourceGroup.files.length - 1,
                  closestEdgeOfTarget: null,
                  axis: 'vertical',
                })
                reorderFile({
                  groupId: sourceGroup.groupId,
                  startIndex: fileIndex,
                  finishIndex: destinationIndex,
                  trigger: 'pointer',
                })
                return
              }

              // moving to a new group
              moveFile({
                fileIndexInStartGroup: fileIndex,
                startGroupId: sourceGroup.groupId,
                finishGroupId: destinationGroup.groupId,
                trigger: 'pointer',
              })
              return
            }

            // dropping in a group (relative to a file)
            if (location.current.dropTargets.length === 2) {
              const [destinationFileRecord, destinationGroupRecord] =
                location.current.dropTargets
              const destinationGroupId = destinationGroupRecord.data.groupId
              invariant(typeof destinationGroupId === 'string')
              const destinationGroup = data.groupMap[destinationGroupId]

              const indexOfTarget = destinationGroup.files.findIndex(
                file => file.fileId === destinationFileRecord.data.fileId,
              )
              const closestEdgeOfTarget: Edge | null = extractClosestEdge(
                destinationFileRecord.data,
              )

              // case 1: ordering in the same group
              if (sourceGroup === destinationGroup) {
                const destinationIndex = getReorderDestinationIndex({
                  startIndex: fileIndex,
                  indexOfTarget,
                  closestEdgeOfTarget,
                  axis: 'vertical',
                })
                reorderFile({
                  groupId: sourceGroup.groupId,
                  startIndex: fileIndex,
                  finishIndex: destinationIndex,
                  trigger: 'pointer',
                })
                return
              }

              // case 2: moving into a new group relative to a file

              const destinationIndex =
                closestEdgeOfTarget === 'bottom'
                  ? indexOfTarget + 1
                  : indexOfTarget

              moveFile({
                fileIndexInStartGroup: fileIndex,
                startGroupId: sourceGroup.groupId,
                finishGroupId: destinationGroup.groupId,
                fileIndexInFinishGroup: destinationIndex,
                trigger: 'pointer',
              })
            }
          }
        },
      }),
    )
  }, [data, instanceId, moveFile, reorderFile, reorderGroup])

  const contextValue: BoardContextValue = useMemo(() => {
    return {
      getGroups,
      reorderGroup,
      reorderFile,
      moveFile,
      registerFile: registry.registerFile,
      registerGroup: registry.registerGroup,
      instanceId,
    }
  }, [getGroups, reorderGroup, reorderFile, registry, moveFile, instanceId])

  const addNewGroup = () => {
    const newGroupId = `group-${Date.now()}`
    const newGroup: FileGroup = {
      groupId: newGroupId,
      groupTitle: `새 그룹 ${data.orderedGroupIds.length}`,
      files: [],
    }

    setData(prev => ({
      ...prev,
      groupMap: {
        ...prev.groupMap,
        [newGroupId]: newGroup,
      },
      orderedGroupIds: [...prev.orderedGroupIds, newGroupId],
      lastOperation: null,
    }))

    // MappingStore에 새 그룹 추가 (빈 파일 배열로 초기화)
    setStep7ComparisonGroups(prevGroups => {
      const updatedGroups = new Map(prevGroups)
      updatedGroups.set(newGroupId, {
        title: newGroup.groupTitle,
        files: [],
      })
      // console.log(
      //   '✅ 그룹 추가:',
      //   newGroupId,
      //   '| 현재 그룹 목록:',
      //   updatedGroups,
      // )
      return updatedGroups
    })
  }

  const updateGroupTitle = (groupId: string, newTitle: string) => {
    setData(prev => ({
      ...prev,
      groupMap: {
        ...prev.groupMap,
        [groupId]: {
          ...prev.groupMap[groupId],
          groupTitle: newTitle,
        },
      },
      lastOperation: null,
    }))

    // MappingStore에도 그룹 이름 업데이트
    updateStep7GroupTitle(groupId, newTitle)
  }

  const deleteGroup = (groupId: string) => {
    setData(prev => {
      const groupToDelete = prev.groupMap[groupId]
      const newGroupMap = { ...prev.groupMap }

      // 삭제할 그룹에 파일이 있으면 "업로드된 파일" 그룹으로 이동
      if (groupToDelete.files.length > 0) {
        const uploadedFilesGroup = newGroupMap['group-1']
        newGroupMap['group-1'] = {
          ...uploadedFilesGroup,
          files: [...uploadedFilesGroup.files, ...groupToDelete.files],
        }
      }

      // 그룹 삭제
      delete newGroupMap[groupId]

      return {
        ...prev,
        groupMap: newGroupMap,
        orderedGroupIds: prev.orderedGroupIds.filter(id => id !== groupId),
        lastOperation: null,
      }
    })

    // MappingStore에서도 해당 그룹 삭제
    setStep7ComparisonGroups(prevGroups => {
      const updatedGroups = new Map(prevGroups)
      const groupToDeleteFromStore = updatedGroups.get(groupId)
      const group1 = updatedGroups.get('group-1')

      // 삭제할 그룹의 파일들을 group-1로 이동
      if (groupToDeleteFromStore && group1) {
        const filesToMove = groupToDeleteFromStore.files
        if (filesToMove.length > 0) {
          updatedGroups.set('group-1', {
            ...group1,
            files: [...group1.files, ...filesToMove],
          })
        }
        // console.log(`❌ 그룹 삭제: ${groupId} | 이동된 파일:`, filesToMove)
      }

      updatedGroups.delete(groupId)
      return updatedGroups
    })
  }

  // 파일 비교 버튼 핸들러
  const handleCompareClick = async () => {
    try {
      // console.log('🔘 파일 비교 버튼 클릭')
      await executeComparison()
      // console.log('✅ 비교 완료 - 결과 페이지로 이동')
      setCurrentView('FILE_COMPARISON')
    } catch (error) {
      console.error('❌ 비교 실행 오류:', error)
      if (error instanceof Error) {
        alert(`비교 실행 오류:\n${error.message}`)
      }
    }
  }

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <BasicSizeTypography sx={{ fontWeight: 'bold', fontSize: '16px' }}>
          파일 병합
        </BasicSizeTypography>
        <Button
          variant="contained"
          disableElevation
          onClick={handleCompareClick}
          disabled={isComparisonLoading}
          startIcon={
            isComparisonLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <CompareArrowsIcon />
            )
          }
        >
          {isComparisonLoading ? '비교 중...' : '파일 비교'}
        </Button>
      </Box>
      <BoardContext.Provider value={contextValue}>
        <Board>
          {data.orderedGroupIds.map(groupId => {
            return (
              <Column
                group={data.groupMap[groupId]}
                key={groupId}
                onUpdateTitle={
                  groupId !== 'group-1' ? updateGroupTitle : undefined
                }
                onDeleteGroup={groupId !== 'group-1' ? deleteGroup : undefined}
              />
            )
          })}
          <Box
            sx={{
              minWidth: '300px',
              maxWidth: '300px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Button
              variant="outlined"
              onClick={addNewGroup}
              sx={{
                height: '100px',
                width: '100%',
                borderStyle: 'dashed',
                borderWidth: '2px',
              }}
            >
              + 그룹 추가
            </Button>
          </Box>
        </Board>
      </BoardContext.Provider>
    </>
  )
}

export default FileMerge
