import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import DeleteIcon from '@mui/icons-material/Delete'
import { Box, Button, styled, Typography } from '@mui/material'
import useDataStore from '../../store/DataStore'

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
})

const Step1_FileUpload = () => {
  const { setFiles, files, setDeletedFiles } = useDataStore()
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        border: '1px dashed #e0e0e0',
        borderRadius: '8px',
        padding: '16px',
        flexDirection: 'column',
      }}
    >
      <Button
        component="label"
        role={undefined}
        variant="contained"
        tabIndex={-1}
        startIcon={<CloudUploadIcon />}
        size="large"
        disableElevation
      >
        파일 업로드
        <VisuallyHiddenInput
          type="file"
          onChange={event => {
            if (event.target.files?.length === 1) {
              setFiles(event.target.files[0])
            } else {
              setFiles(Array.from(event.target.files ?? []))
            }
            // input value 초기화하여 같은 파일 재선택 가능하도록
            event.target.value = ''
          }}
          multiple
          accept=".xlsx"
        />
      </Button>
      {/* 업로드된 파일들 표시 */}
      {files && files.length > 0 && (
        <Box mt={2}>
          {files.map((file, index) => (
            <Box
              key={index}
              my={1}
              sx={{
                border: '1px dashed #e0e0e0',
                borderRadius: '8px',
                padding: '8px',
              }}
            >
              <Typography
                key={index}
                variant="body2"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                {file.name} ({(file.size / 1024).toFixed(2)} KB)
                <Button
                  onClick={() =>
                    setDeletedFiles(files.filter((_, i) => i !== index))
                  }
                  size="small"
                  startIcon={<DeleteIcon />}
                />
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}

export default Step1_FileUpload
