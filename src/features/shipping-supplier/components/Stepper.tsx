import { Step, StepLabel, Stepper } from '@mui/material'
import React from 'react'
import useDataStore from '../store/DataStore'

const steps = [
  '파일 업로드',
  '시트 선택',
  '중복 데이터 제거',
  '배송비 수량 체크',
]

const StepperComponent = () => {
  const { currentStep } = useDataStore()

  return (
    <Stepper activeStep={currentStep}>
      {steps.map((label) => {
        const stepProps: { completed?: boolean } = {}
        const labelProps: {
          optional?: React.ReactNode
        } = {}
        return (
          <Step key={label} {...stepProps}>
            <StepLabel {...labelProps}>{label}</StepLabel>
          </Step>
        )
      })}
    </Stepper>
  )
}

export default StepperComponent
