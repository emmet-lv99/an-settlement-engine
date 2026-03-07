import { Step, StepLabel, Stepper, Typography } from '@mui/material'
import React from 'react'
import useDataStore from '../store/DataStore'

const steps = [
  '파일 업로드',
  '기준 데이터 선택',
  '비교 항목 선택',
  '열 매핑',
  '항목 값 매핑',
  '옵션/수량 정규화',
  '비교 결과 도출',
]

const StepperComponent = () => {
  const { currentStep, optionalSteps, skippedSteps } = useDataStore()

  return (
    <Stepper activeStep={currentStep}>
      {steps.map((label, index) => {
        const stepProps: { completed?: boolean } = {}
        const labelProps: {
          optional?: React.ReactNode
        } = {}
        if (optionalSteps.has(index)) {
          labelProps.optional = (
            <Typography variant="caption">(선택사항)</Typography>
          )
        }
        if (skippedSteps.has(index)) {
          stepProps.completed = false
        }
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
