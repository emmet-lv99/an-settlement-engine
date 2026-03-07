# Step7 파일 병합 기능 완벽 가이드

## 📚 목차

1. [개요](#개요)
2. [전체 아키텍처](#전체-아키텍처)
3. [파일별 상세 설명](#파일별-상세-설명)
4. [데이터 흐름](#데이터-흐름)
5. [드래그 앤 드롭 동작 원리](#드래그-앤-드롭-동작-원리)
6. [주요 개념 설명](#주요-개념-설명)
7. [개발 시 주의사항](#개발-시-주의사항)
8. [트러블슈팅](#트러블슈팅)

---

## 개요

### 🎯 목적
Step7은 사용자가 업로드한 여러 파일을 **드래그 앤 드롭**으로 그룹화하고 병합하는 기능을 제공합니다.

### 🔑 핵심 기능
- **파일 카드 드래그**: 개별 파일을 마우스로 드래그하여 이동
- **그룹 생성**: 사용자가 원하는 만큼 그룹 추가 가능
- **그룹 관리**: 그룹 제목 편집, 그룹 삭제
- **드래그 앤 드롭**: 파일을 다른 그룹으로 자유롭게 이동
- **시각적 피드백**: 드래그 중 투명도, 드롭 가능 영역 표시

### 🛠 사용 기술
- **React** (useState, useEffect, useContext, useRef, useMemo, useCallback)
- **TypeScript** (타입 안전성)
- **Zustand** (전역 상태 관리 - DataStore)
- **Material-UI** (UI 컴포넌트)
- **@atlaskit/pragmatic-drag-and-drop** (드래그 앤 드롭 라이브러리)

---

## 전체 아키텍처

### 📁 폴더 구조

```
step7-results-dashboard/
├── components/
│   ├── data/
│   │   └── FileData.ts          # 데이터 타입 정의
│   ├── pieces/
│   │   ├── Board.tsx            # 보드 컨테이너
│   │   ├── BoardContext.tsx     # React Context
│   │   ├── Card.tsx             # 파일 카드
│   │   ├── Column.tsx           # 그룹(컬럼)
│   │   └── Registry.ts          # DOM 요소 레지스트리
│   ├── FileMerge.tsx            # 메인 컴포넌트 (상태 관리)
│   └── ModeSelector.tsx         # 비교 모드 선택
└── STEP7_GUIDE.md              # 이 문서
```

### 🔄 컴포넌트 계층 구조

```
FileMerge (메인 컴포넌트)
  ├─ BoardContext.Provider (Context 제공)
  │   └─ Board (레이아웃 컨테이너)
  │       ├─ Column (그룹 1)
  │       │   ├─ Card (파일 1)
  │       │   ├─ Card (파일 2)
  │       │   └─ Card (파일 3)
  │       ├─ Column (그룹 2)
  │       │   └─ Card (파일 4)
  │       └─ Button (+ 그룹 추가)
```

---

## 파일별 상세 설명

### 1️⃣ FileData.ts - 데이터 타입 정의

**역할**: 드래그 앤 드롭 보드의 데이터 구조를 정의합니다.

#### 핵심 타입

```typescript
// 개별 파일
type FileItem = {
  fileId: string      // "file-1", "file-2"
  fileName: string    // "주문내역서.xlsx"
  itemCount: string   // "100개 항목"
}

// 파일 그룹 (컬럼)
type FileGroup = {
  groupId: string       // "group-1", "group-2"
  groupTitle: string    // "업로드된 파일"
  files: FileItem[]     // 그룹에 속한 파일 목록
}

// 그룹 맵 (효율적인 접근을 위한 맵 구조)
type GroupMap = {
  [groupId: string]: FileGroup
}

// 전체 보드 상태
type BoardDataSet = {
  groupMap: GroupMap        // 모든 그룹 데이터
  orderedGroupIds: string[] // 그룹의 순서
}
```

#### 핵심 함수

```typescript
function getBasicData(parsedData: ParsedDataDto[]): BoardDataSet
```

**목적**: 업로드된 파일 데이터를 드래그 앤 드롭 보드 형식으로 변환

**동작**:
1. `parsedData`를 `FileItem` 형식으로 변환
2. "업로드된 파일"이라는 기본 그룹(`group-1`) 생성
3. 모든 파일을 기본 그룹에 배치

**사용 시점**:
- FileMerge 컴포넌트 초기화 시
- 새 파일 업로드 시

---

### 2️⃣ BoardContext.tsx - React Context

**역할**: 드래그 앤 드롭 보드의 상태와 동작을 하위 컴포넌트에 전달합니다.

#### 왜 Context를 사용하는가?

```
FileMerge (상태 관리)
  └─ Board
      └─ Column
          └─ Card  ← 여기서 보드의 함수가 필요!
```

Props로 전달하면 3단계를 거쳐야 하지만, Context를 사용하면 바로 접근 가능합니다.

#### 제공하는 함수들

| 함수 | 역할 | 호출 시점 |
|------|------|-----------|
| `getGroups()` | 모든 그룹 조회 | 렌더링 시 |
| `reorderGroup()` | 그룹 순서 변경 | 그룹 드래그 완료 시 |
| `reorderFile()` | 같은 그룹 내 파일 순서 변경 | 같은 그룹 내 파일 드래그 시 |
| `moveFile()` | 다른 그룹으로 파일 이동 | 다른 그룹으로 파일 드래그 시 |
| `registerFile()` | 파일 카드 DOM 등록 | Card 마운트 시 |
| `registerGroup()` | 그룹 DOM 등록 | Column 마운트 시 |

#### instanceId의 역할

```typescript
instanceId: symbol
```

**목적**: 한 화면에 여러 드래그 앤 드롭 보드가 있을 때 충돌 방지

**동작**:
- 드래그 시작 시 `instanceId`를 드래그 데이터에 포함
- 드롭 가능 여부 체크 시 `instanceId` 비교
- 다른 보드의 아이템은 드롭 불가

---

### 3️⃣ Registry.ts - DOM 요소 레지스트리

**역할**: 드래그 앤 드롭되는 요소의 DOM을 등록하고 관리합니다.

#### 왜 레지스트리가 필요한가?

드래그 완료 후:
1. **애니메이션 효과** (`triggerPostMoveFlash`) 적용
2. **포커스 복원** (접근성)

이를 위해 **ID만으로 실제 DOM 요소에 빠르게 접근**(O(1))해야 합니다.

#### 내부 구조

```typescript
// Private 변수 (클로저로 캡슐화)
const files: Map<string, FileEntry> = new Map()
const groups: Map<string, GroupEntry> = new Map()

// 예시
files = Map {
  "file-1" => { element: <div>, actionMenuTrigger: <button> },
  "file-2" => { element: <div>, actionMenuTrigger: <button> }
}
```

#### 동작 흐름

```
1. Card 컴포넌트 마운트
   → registerFile() 호출
   → Map에 등록
   → cleanup 함수 반환

2. 드래그 완료 (FileMerge)
   → getFile(fileId) 호출
   → DOM 요소 조회
   → 애니메이션/포커스 적용

3. Card 컴포넌트 언마운트
   → cleanup 함수 실행
   → Map에서 삭제
```

---

### 4️⃣ Board.tsx - 보드 컨테이너

**역할**: 모든 그룹(Column)을 가로로 배치하는 Flexbox 컨테이너

#### 스타일 설명

```typescript
<Box sx={{
  display: 'flex',          // 가로 배치
  gap: '16px',              // 그룹 간 간격
  padding: '16px',          // 내부 여백
  backgroundColor: '#f5f5f5', // 연한 회색 배경
  borderRadius: '8px',      // 모서리 둥글게
  minHeight: '400px',       // 최소 높이 (빈 공간 확보)
}}>
```

#### minHeight가 중요한 이유

- 파일이 없어도 그룹을 **드롭할 수 있는 영역** 확보
- 시각적으로 안정적인 레이아웃

---

### 5️⃣ Card.tsx - 파일 카드

**역할**: 드래그 가능한 개별 파일 카드를 렌더링합니다.

#### 핵심 로직

```typescript
useEffect(() => {
  return combine(
    // 1. DOM 등록
    boardContext.registerFile({...}),
    
    // 2. 드래그 가능 설정
    draggable({
      element: cardEl,
      dragHandle: dragHandleEl,  // ≡ 아이콘만 드래그 가능
      getInitialData: () => ({
        fileId: file.fileId,
        type: 'file',
        instanceId: boardContext.instanceId
      })
    }),
    
    // 3. 드롭 타겟 설정
    dropTargetForElements({
      element: cardEl,
      canDrop: ({ source }) => 
        source.data.instanceId === boardContext.instanceId &&
        source.data.type === 'file'
    })
  )
}, [file.fileId, boardContext])
```

#### 시각적 피드백

| 상태 | 스타일 변화 |
|------|------------|
| 평상시 | `opacity: 1`, `elevation: 1` |
| 드래그 중 | `opacity: 0.5`, `elevation: 8` (그림자 강조) |
| 드래그 오버 | `borderTop: 2px solid #1976d2` (파란색 선) |

---

### 6️⃣ Column.tsx - 그룹(컬럼)

**역할**: 파일들을 담는 그룹 컨테이너를 렌더링합니다.

#### 주요 기능

1. **그룹 제목 편집**
   - Edit 아이콘 클릭 → TextField로 전환
   - Enter 키 → 저장
   - Escape 키 → 취소

2. **그룹 삭제**
   - Delete 아이콘 클릭
   - 파일이 있으면 확인 메시지
   - 삭제 시 파일들은 "업로드된 파일" 그룹으로 이동

3. **드래그 앤 드롭**
   - 헤더를 드래그하여 그룹 순서 변경
   - 파일을 드롭하여 그룹에 추가

#### 특수 처리: group-1

```typescript
// "업로드된 파일" 그룹은 편집/삭제 불가
onUpdateTitle={groupId !== 'group-1' ? updateGroupTitle : undefined}
onDeleteGroup={groupId !== 'group-1' ? deleteGroup : undefined}
```

---

### 7️⃣ FileMerge.tsx - 메인 컴포넌트

**역할**: 전체 드래그 앤 드롭 보드의 상태를 관리하는 핵심 컴포넌트입니다.

#### 상태 구조

```typescript
type BoardState = {
  groupMap: GroupMap              // 모든 그룹 데이터
  orderedGroupIds: string[]       // 그룹 순서
  lastOperation: DragOperation | null  // 마지막 작업 (애니메이션용)
}
```

#### 핵심 함수들

##### 1. reorderGroup - 그룹 순서 변경

```typescript
const reorderGroup = useCallback(({ startIndex, finishIndex }) => {
  setData(data => ({
    ...data,
    orderedGroupIds: reorder({
      list: data.orderedGroupIds,
      startIndex,
      finishIndex,
    }),
    lastOperation: { outcome: {...}, trigger: 'pointer' }
  }))
}, [])
```

**동작**: `orderedGroupIds` 배열의 순서만 변경 (그룹 데이터는 그대로)

##### 2. reorderFile - 같은 그룹 내 파일 순서 변경

```typescript
const reorderFile = useCallback(({ groupId, startIndex, finishIndex }) => {
  setData(data => {
    const sourceGroup = data.groupMap[groupId]
    const updatedFiles = reorder({
      list: sourceGroup.files,
      startIndex,
      finishIndex,
    })
    
    return {
      ...data,
      groupMap: {
        ...data.groupMap,
        [groupId]: {
          ...sourceGroup,
          files: updatedFiles
        }
      }
    }
  })
}, [])
```

**동작**: 특정 그룹의 `files` 배열 순서만 변경

##### 3. moveFile - 다른 그룹으로 파일 이동

```typescript
const moveFile = useCallback(({
  startGroupId,
  finishGroupId,
  fileIndexInStartGroup,
  fileIndexInFinishGroup
}) => {
  setData(data => {
    const sourceGroup = data.groupMap[startGroupId]
    const destinationGroup = data.groupMap[finishGroupId]
    const file = sourceGroup.files[fileIndexInStartGroup]
    
    return {
      ...data,
      groupMap: {
        ...data.groupMap,
        [startGroupId]: {
          ...sourceGroup,
          files: sourceGroup.files.filter(f => f.fileId !== file.fileId)
        },
        [finishGroupId]: {
          ...destinationGroup,
          files: [...destinationGroup.files, file]
        }
      }
    }
  })
}, [])
```

**동작**:
1. 출발 그룹에서 파일 제거
2. 도착 그룹에 파일 추가

##### 4. addNewGroup - 새 그룹 추가

```typescript
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
  }))
}
```

**동작**:
1. 고유 ID 생성 (`Date.now()` 사용)
2. 빈 그룹 생성
3. `groupMap`과 `orderedGroupIds`에 추가

##### 5. deleteGroup - 그룹 삭제

```typescript
const deleteGroup = (groupId: string) => {
  setData(prev => {
    const groupToDelete = prev.groupMap[groupId]
    const newGroupMap = { ...prev.groupMap }
    
    // 파일이 있으면 "업로드된 파일" 그룹으로 이동
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
    }
  })
}
```

**동작**:
1. 삭제할 그룹의 파일들을 `group-1`로 이동
2. `groupMap`에서 그룹 삭제
3. `orderedGroupIds`에서 ID 제거

#### 드래그 모니터링

```typescript
useEffect(() => {
  return combine(
    monitorForElements({
      canMonitor({ source }) {
        return source.data.instanceId === instanceId
      },
      onDrop(args) {
        // 드래그 타입 확인 (group vs file)
        // 드롭 위치 계산
        // 해당 함수 호출 (reorderGroup, reorderFile, moveFile)
      },
    }),
  )
}, [data, instanceId, moveFile, reorderFile, reorderGroup])
```

**역할**: 전역 드래그 이벤트를 감지하고 적절한 함수 호출

#### 애니메이션 처리

```typescript
useEffect(() => {
  if (lastOperation === null) return
  
  const { outcome, trigger } = lastOperation
  
  if (outcome.type === 'file-move') {
    const file = destinationGroup.files[fileIndex]
    const entry = registry.getFile(file.fileId)
    triggerPostMoveFlash(entry.element)  // 깜빡임 효과
    entry.actionMenuTrigger.focus()      // 포커스 복원
  }
}, [lastOperation, registry])
```

**역할**: 드래그 완료 후 애니메이션과 포커스 복원

---

## 데이터 흐름

### 초기 로드

```
1. DataStore (Zustand)
   ↓
   parsedData = [
     { id: 1, name: "file1.xlsx", data: [...] },
     { id: 2, name: "file2.xlsx", data: [...] }
   ]

2. FileMerge.tsx
   ↓
   const [data, setData] = useState(() => getBasicData(parsedData))

3. getBasicData (FileData.ts)
   ↓
   {
     groupMap: {
       "group-1": {
         groupId: "group-1",
         groupTitle: "업로드된 파일",
         files: [
           { fileId: "file-1", fileName: "file1.xlsx", itemCount: "N개 항목" },
           { fileId: "file-2", fileName: "file2.xlsx", itemCount: "M개 항목" }
         ]
       }
     },
     orderedGroupIds: ["group-1"]
   }

4. Board → Column → Card
   ↓
   화면에 렌더링
```

### 드래그 앤 드롭

```
1. 사용자: 파일 카드 드래그 시작
   ↓
2. Card.tsx: draggable의 getInitialData() 실행
   → 드래그 데이터 { fileId, type: 'file', instanceId }

3. 사용자: 다른 그룹으로 드래그
   ↓
4. Column.tsx: dropTargetForElements의 canDrop() 실행
   → instanceId 체크 → true

5. 사용자: 드롭 (마우스 버튼 놓음)
   ↓
6. FileMerge.tsx: monitorForElements의 onDrop() 실행
   → 드롭 위치 계산
   → moveFile() 호출

7. moveFile():
   setData(data => ({
     ...data,
     groupMap: {
       [startGroupId]: { files: [...출발 그룹에서 제거] },
       [finishGroupId]: { files: [...도착 그룹에 추가] }
     },
     lastOperation: { outcome: {...}, trigger: 'pointer' }
   }))

8. React 리렌더링
   ↓
9. useEffect (lastOperation 감지)
   → registry.getFile(fileId)
   → triggerPostMoveFlash(element)
   → entry.actionMenuTrigger.focus()

10. 화면: 파일이 새 그룹에 표시되며 깜빡임 효과
```

---

## 드래그 앤 드롭 동작 원리

### @atlaskit/pragmatic-drag-and-drop 라이브러리

#### 주요 API

1. **draggable()** - 요소를 드래그 가능하게 만듦

```typescript
draggable({
  element: cardEl,              // 드래그할 요소
  dragHandle: dragHandleEl,     // 드래그 핸들 (없으면 전체 요소)
  getInitialData: () => ({      // 드래그 데이터
    fileId: "file-1",
    type: "file"
  }),
  onDragStart: () => {...},     // 드래그 시작
  onDrop: () => {...}            // 드롭 완료
})
```

2. **dropTargetForElements()** - 드롭 타겟으로 설정

```typescript
dropTargetForElements({
  element: cardEl,              // 드롭 타겟 요소
  getData: () => ({             // 드롭 데이터
    fileId: "file-2"
  }),
  canDrop: ({ source }) => {    // 드롭 가능 여부
    return source.data.type === 'file'
  },
  onDragEnter: () => {...},     // 드래그 진입
  onDragLeave: () => {...},     // 드래그 벗어남
  onDrop: () => {...}            // 드롭 완료
})
```

3. **monitorForElements()** - 전역 드래그 이벤트 감지

```typescript
monitorForElements({
  canMonitor({ source }) {      // 모니터링할 이벤트 필터
    return source.data.instanceId === myInstanceId
  },
  onDrop(args) {                // 드롭 완료 시 실행
    const { location, source } = args
    // location: 드롭 위치 정보
    // source: 드래그 중인 요소 정보
  }
})
```

#### 드롭 위치 계산

```typescript
// location.current.dropTargets.length로 상황 파악

// Case 1: length === 1 (그룹 자체에 드롭)
const [destinationGroupRecord] = location.current.dropTargets
// → 그룹의 맨 아래에 삽입

// Case 2: length === 2 (다른 카드 위에 드롭)
const [destinationCardRecord, destinationGroupRecord] = location.current.dropTargets
const closestEdge = extractClosestEdge(destinationCardRecord.data)
// closestEdge === 'top' → 카드 위에 삽입
// closestEdge === 'bottom' → 카드 아래에 삽입
```

---

## 주요 개념 설명

### 1. 왜 groupMap과 orderedGroupIds를 함께 사용하는가?

```typescript
type BoardState = {
  groupMap: GroupMap        // 데이터 저장
  orderedGroupIds: string[] // 순서 관리
}
```

**이유**:
- JavaScript 객체(Object)의 키 순서는 보장되지 않음
- 사용자가 드래그로 변경한 순서를 **정확히** 유지해야 함

**동작**:
```typescript
// 렌더링 시
orderedGroupIds.map(groupId => {
  const group = groupMap[groupId]  // O(1) 접근
  return <Column key={groupId} group={group} />
})
```

### 2. Registry 패턴

**목적**: ID와 실제 DOM 요소를 매핑

**필요한 이유**:
- React는 가상 DOM을 사용하여 실제 DOM과 분리
- 드래그 완료 후 애니메이션을 위해 **실제 DOM 요소** 필요
- `registry.getFile(fileId)` → O(1) 시간에 DOM 조회

### 3. Cleanup 패턴

```typescript
useEffect(() => {
  const cleanup = boardContext.registerFile({...})
  return cleanup  // 언마운트 시 자동 호출
}, [fileId])
```

**이유**:
- 메모리 누수 방지
- 컴포넌트가 사라지면 레지스트리에서도 제거해야 함

### 4. combine() 함수

```typescript
return combine(
  cleanup1,
  cleanup2,
  cleanup3
)
```

**역할**: 여러 cleanup 함수를 하나로 합쳐서 반환

**사용 이유**:
- useEffect는 하나의 cleanup 함수만 반환 가능
- draggable, dropTargetForElements, registerFile 모두 cleanup 필요
- combine으로 합쳐서 한 번에 정리

---

## 개발 시 주의사항

### ⚠️ 1. 불변성 유지 (Immutability)

❌ **잘못된 예시**:
```typescript
const updateGroup = (groupId: string) => {
  data.groupMap[groupId].title = "새 제목"  // 직접 수정 (X)
  setData(data)  // React가 변화를 감지하지 못함
}
```

✅ **올바른 예시**:
```typescript
const updateGroup = (groupId: string) => {
  setData(prev => ({
    ...prev,  // 전체 복사
    groupMap: {
      ...prev.groupMap,  // groupMap 복사
      [groupId]: {
        ...prev.groupMap[groupId],  // 특정 그룹 복사
        title: "새 제목"  // 속성만 변경
      }
    }
  }))
}
```

### ⚠️ 2. useEffect 의존성 배열

❌ **잘못된 예시**:
```typescript
useEffect(() => {
  const cleanup = boardContext.registerFile({
    fileId: file.fileId,
    entry: {...}
  })
  return cleanup
}, [])  // 빈 배열 (X)
// file.fileId가 변경되어도 재등록되지 않음
```

✅ **올바른 예시**:
```typescript
useEffect(() => {
  const cleanup = boardContext.registerFile({
    fileId: file.fileId,
    entry: {...}
  })
  return cleanup
}, [file.fileId, boardContext])  // 의존성 명시
```

### ⚠️ 3. null 체크

❌ **잘못된 예시**:
```typescript
const boardContext = useContext(BoardContext)
boardContext.registerFile({...})  // boardContext가 null일 수 있음 (X)
```

✅ **올바른 예시**:
```typescript
const boardContext = useContext(BoardContext)
if (!boardContext) return null  // null 체크 필수
boardContext.registerFile({...})
```

### ⚠️ 4. 고유 ID 생성

❌ **잘못된 예시**:
```typescript
const newGroupId = `group-${Math.random()}`  // 충돌 가능성
```

✅ **올바른 예시**:
```typescript
const newGroupId = `group-${Date.now()}`  // 타임스탬프 (충돌 거의 없음)
// 또는
const newGroupId = `group-${crypto.randomUUID()}`  // UUID (완전 고유)
```

### ⚠️ 5. instanceId 체크

```typescript
// 반드시 같은 보드의 아이템만 드롭 가능하도록
canDrop: ({ source }) => {
  return source.data.instanceId === boardContext.instanceId
}
```

**이유**: 다른 보드의 아이템이 잘못 드롭되는 것을 방지

---

## 트러블슈팅

### 🐛 문제 1: 드래그가 작동하지 않음

**증상**: 파일 카드를 드래그할 수 없음

**원인**:
1. `dragHandle`이 제대로 설정되지 않음
2. `boardContext`가 null
3. ref가 아직 준비되지 않음

**해결**:
```typescript
useEffect(() => {
  if (!cardEl || !dragHandleEl || !boardContext) {
    return  // DOM이 준비될 때까지 대기
  }
  // 드래그 설정...
}, [file.fileId, boardContext])
```

### 🐛 문제 2: 드롭 후 파일이 사라짐

**증상**: 파일을 드롭하면 화면에서 사라짐

**원인**:
- `moveFile()` 함수에서 파일을 제거만 하고 추가하지 않음

**해결**:
```typescript
const moveFile = (...) => {
  setData(data => {
    // 1. 출발 그룹에서 제거 ✓
    // 2. 도착 그룹에 추가 ✓ (이 부분 누락 확인)
  })
}
```

### 🐛 문제 3: 그룹 순서가 변경되지 않음

**증상**: 그룹을 드래그해도 순서가 바뀌지 않음

**원인**:
- `orderedGroupIds` 배열을 직접 수정
- 불변성 위반으로 React가 변화 감지 못함

**해결**:
```typescript
// reorder() 함수 사용 (새 배열 반환)
orderedGroupIds: reorder({
  list: data.orderedGroupIds,
  startIndex,
  finishIndex,
})
```

### 🐛 문제 4: 애니메이션이 작동하지 않음

**증상**: 드롭 후 깜빡임 효과 없음

**원인**:
- `lastOperation`이 업데이트되지 않음
- `registry.getFile()` 실패 (등록되지 않음)

**해결**:
```typescript
// 1. moveFile()에서 lastOperation 설정 확인
lastOperation: { outcome: {...}, trigger: 'pointer' }

// 2. Card에서 registerFile() 호출 확인
boardContext.registerFile({...})

// 3. useEffect에서 lastOperation 감지 확인
useEffect(() => {
  if (lastOperation === null) return
  // 애니메이션 로직...
}, [lastOperation, registry])
```

### 🐛 문제 5: 메모리 누수

**증상**: 시간이 지날수록 브라우저가 느려짐

**원인**:
- cleanup 함수가 실행되지 않음
- 레지스트리에 DOM 요소가 계속 쌓임

**해결**:
```typescript
useEffect(() => {
  const cleanup = boardContext.registerFile({...})
  return cleanup  // 반드시 cleanup 반환
}, [file.fileId, boardContext])
```

---

## 추가 개선 아이디어

### 💡 1. 로컬 스토리지 저장

사용자가 만든 그룹 구조를 브라우저에 저장하여 새로고침 후에도 유지

```typescript
useEffect(() => {
  localStorage.setItem('fileMergeState', JSON.stringify(data))
}, [data])
```

### 💡 2. 실행 취소 (Undo)

드래그 앤 드롭 히스토리를 관리하여 실행 취소 기능 제공

```typescript
const [history, setHistory] = useState<BoardState[]>([])
const undo = () => {
  const prevState = history[history.length - 1]
  setData(prevState)
}
```

### 💡 3. 키보드 단축키

마우스 없이 키보드만으로 파일 이동

```typescript
// 화살표 키로 포커스 이동
// Ctrl+X, Ctrl+V로 잘라내기/붙여넣기
```

### 💡 4. 다중 선택

여러 파일을 동시에 선택하여 한 번에 이동

```typescript
const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
```

### 💡 5. 그룹 복사

기존 그룹을 복사하여 새 그룹 생성

```typescript
const duplicateGroup = (groupId: string) => {
  const sourceGroup = data.groupMap[groupId]
  const newGroupId = `group-${Date.now()}`
  // sourceGroup의 구조를 복사하여 새 그룹 생성
}
```

---

## 참고 자료

### 공식 문서
- [Atlaskit Pragmatic Drag and Drop](https://atlassian.design/components/pragmatic-drag-and-drop/about)
- [React Hooks 공식 문서](https://react.dev/reference/react)
- [Material-UI 공식 문서](https://mui.com/)

### 관련 개념
- **Controlled vs Uncontrolled Components** (React)
- **Context API** (React)
- **Closure** (JavaScript)
- **Immutability** (함수형 프로그래밍)
- **Registry Pattern** (디자인 패턴)

---

## 마무리

이 가이드는 Step7 파일 병합 기능을 **완전히 이해**하고 **직접 수정**할 수 있도록 작성되었습니다.

### 학습 순서 추천

1. ✅ **FileData.ts** - 데이터 구조 이해
2. ✅ **Board.tsx** - 간단한 컨테이너
3. ✅ **BoardContext.tsx** - Context 개념
4. ✅ **Registry.ts** - Registry 패턴
5. ✅ **Card.tsx** - 드래그 가능 요소
6. ✅ **Column.tsx** - 드롭 타겟
7. ✅ **FileMerge.tsx** - 전체 상태 관리

### 코드 수정 시 체크리스트

- [ ] 불변성을 유지했는가?
- [ ] useEffect 의존성 배열이 올바른가?
- [ ] null 체크를 했는가?
- [ ] cleanup 함수를 반환했는가?
- [ ] instanceId를 체크했는가?
- [ ] 고유 ID를 생성했는가?

### 도움이 필요하면

1. 코드 주석 읽기
2. 이 가이드 문서 참조
3. console.log()로 데이터 흐름 추적
4. React DevTools로 상태 확인

**화이팅! 🚀**

