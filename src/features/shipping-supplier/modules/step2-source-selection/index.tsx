import { Checkbox, FormControl, FormControlLabel, FormGroup, FormLabel } from "@mui/material";
import useDataStore from "../../store/DataStore";

const Step2_SourceSelection = () => { 
  const {sheetNames, selectedSheetNames, setSelectedSheetNames} = useDataStore()

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const target = event.target.name
    if(selectedSheetNames.includes(target)) {
      const updatedNames = selectedSheetNames.filter(sheet => sheet !== target)
      setSelectedSheetNames(updatedNames)
    } else {
      setSelectedSheetNames([...selectedSheetNames, target])
    }
  }

  return   <FormControl>
      <FormLabel>
        시트 목록
      </FormLabel>
       <FormGroup>
          {
            sheetNames.map( (sheet, i) => {
              return <FormControlLabel key={i} control={
              <Checkbox 
                checked={selectedSheetNames.includes(sheet)} 
                onChange={handleChange} 
                name={sheet} 
                />
            } 
              label={sheet} />
            })
          }
        </FormGroup>
    </FormControl>
}

export default Step2_SourceSelection;