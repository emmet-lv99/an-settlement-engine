export class ParsedDataDto {
  id: number
  name: string
  sheetName: string
  data: Record<string, unknown>[]

  constructor(
    id: number,
    name: string,
    sheetName: string,
    data: Record<string, unknown>[],
  ) {
    this.id = id
    this.name = name
    this.sheetName = sheetName
    this.data = data
  }
}
