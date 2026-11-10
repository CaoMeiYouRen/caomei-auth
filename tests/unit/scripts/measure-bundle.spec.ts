import { describe, expect, it } from 'vitest'
import { extractEntryFiles, summarizeBundle } from '../../../scripts/migration/measure-bundle.mjs'

describe('scripts/migration/measure-bundle', () => {
    it('extracts entry js and css from precomputed manifest', () => {
        const source = 'const U={resourceType:"script",file:"DoCmMT2q.js",name:"entry",isEntry:true},V={file:"entry.CxWJT6FN.css",resourceType:"style"}'

        expect(extractEntryFiles(source)).toStrictEqual({
            js: 'DoCmMT2q.js',
            css: 'entry.CxWJT6FN.css',
        })
    })

    it('extracts entry js when property order changes', () => {
        const source = 'const U={resourceType:"script",name:"entry",file:"DoCmMT2q.js",isEntry:true},V={file:"entry.CxWJT6FN.css"}'

        expect(extractEntryFiles(source)).toStrictEqual({
            js: 'DoCmMT2q.js',
            css: 'entry.CxWJT6FN.css',
        })
    })

    it('returns undefined when entry files are absent', () => {
        expect(extractEntryFiles('const x = 1')).toStrictEqual({ js: undefined, css: undefined })
    })

    it('normalizes missing sizes to zero', () => {
        expect(summarizeBundle({ totalJs: 10, totalCss: 20 })).toStrictEqual({
            entryJs: 0,
            entryCss: 0,
            totalJs: 10,
            totalCss: 20,
        })
    })
})
