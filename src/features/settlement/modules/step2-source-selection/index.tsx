import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
} from '@mui/material'
import { useEffect } from 'react'
import useDataStore from '../../store/DataStore'

const Step2_SourceSelection = () => {
  const { parsedData, setSelectedDataId, selectedDataId } = useDataStore()

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDataId(Number(event.target.value))
  }

  useEffect(() => {
    if (parsedData.length > 0) {
      setSelectedDataId(parsedData[0].id)
    }
  }, [parsedData, setSelectedDataId])

  return (
    <FormControl>
      <FormLabel id="demo-radio-buttons-group-label">
        등록된 데이터 목록
      </FormLabel>
      <RadioGroup
        aria-labelledby="demo-radio-buttons-group-label"
        value={selectedDataId ?? parsedData[0].id}
        name="radio-buttons-group"
        onChange={handleChange}
      >
        {parsedData.map(data => (
          <FormControlLabel
            key={data.id}
            value={data.id}
            control={<Radio />}
            label={data.name}
          />
        ))}
      </RadioGroup>
    </FormControl>
  )
}

export default Step2_SourceSelection
