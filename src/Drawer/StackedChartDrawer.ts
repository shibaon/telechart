import { SimpleChartDrawer } from './SimpleChartDrawer'
import { Telecolumn } from '../Telecolumn'
import { Telemation } from '../Telemation'

export class StackedChartDrawer extends SimpleChartDrawer {
    public valuesLength = 0

    get currentPoint() {
        if (this.columns.length && this.columns[0].currentPoint) {
            return this.columns[0].currentPoint.x
        }
    }

    public drawColumns() {
        let prev: number[]|undefined
        const borders = [this.borders.minX.value, this.borders.maxX.value] as [number, number]
        for (const col of this.columns) {
            const result = this.drawColumn(col, prev, borders)
            if (result && !prev) {
                prev = result
            } else if (result) {
                for (let n = result.length - 1; n >= 0; n--) {
                    prev![n] = prev![n] + result[n]
                }
            }
        }
        if (!this.borders.maxX.finished || !this.borders.maxY.finished) {
            this.telechart.redraw()
        }
    }

    public drawColumn(column: Telecolumn, prev?: number[], borders?: [number, number]): number[]|undefined {
        if (!column.opacity.value) {
            return
        }
        const c = this.telecanvas
        const allVals = this.getInDisplayColumnValues(column, borders)
        if (allVals.length) {
            const currentPoint = this.currentPoint
            const colOpacityVal = column.opacity.value
            let opacity = Math.round((currentPoint ? .5 : 1) * 255).toString(16)
            if (opacity.length === 1) {
                opacity = '0' + opacity
            }
            const result: number[] = []
            const path: Array<[number, number]> = []
            const valsPrep: Array<{ x: number, y: number, height: number }> = []
            let current: Array<[number, number]>|undefined
            this.valuesLength = allVals.length
            for (let n = 0; n < allVals.length; n++) {
                const x = this.getCanvasX(allVals[n].x, borders)
                const ySt = this.getCanvasY(0)
                let height = ySt - this.getCanvasY(allVals[n].y)
                if (colOpacityVal < 1) {
                    height *= colOpacityVal
                }
                const y = ySt - height - (prev ? prev[n] : 0)
                if (height < 2) {
                    height = 2
                }
                if (n) {
                    path[path.length - 1][0] = x
                }
                path.push([x, y])
                path.push([x, y])
                valsPrep.push({ x, y, height })
                result.push(height)
                if (allVals[n].x === currentPoint) {
                    current = [[x, y], [n + 1 < allVals.length ? this.getCanvasX(allVals[n + 1].x, borders) : x + 30, y]]
                    current.push([current[current.length - 1][0], y + height])
                    current.push([x, y + height])
                }
            }
            for (let n = valsPrep.length - 1; n >= 0; n--) {
                path.push([path[n * 2 + 1][0], valsPrep[n].y + valsPrep[n].height])
                path.push([path[n * 2][0], valsPrep[n].y + valsPrep[n].height])
            }
            c.shape(path, column.color + opacity)
            if (current) {
                c.shape(current, column.color)
            }
            if (!column.opacity.finished) {
                this.telechart.redraw()
            }
            return result
        }
    }

    protected getNewBorders(duration?: number) {
        const result = {
            minX: Math.min(...this.columns.filter(c => c.visible).map(c => c.getMinX(this.isRangeDisplay))),
            maxX: Math.max(...this.columns.filter(c => c.visible).map(c => c.getMaxX(this.isRangeDisplay))),
            minY: 0,
            maxY: this.columns.filter(c => c.visible).map(c => c.getMaxY(this.isRangeDisplay)).reduce((r, v) => r + v, 0),
        }
        return {
            minX: duration && this.borders ? Telemation.create(this.borders.minX.value, result.minX, 100) : Telemation.create(result.minX),
            maxX: duration && this.borders ? Telemation.create(this.borders.maxX.value, result.maxX, 100) : Telemation.create(result.maxX),
            minY: Telemation.create(result.minY),
            maxY: duration && this.borders ? Telemation.create(this.borders.maxY.value, result.maxY, duration) : Telemation.create(result.maxY),
        }
    }

}
