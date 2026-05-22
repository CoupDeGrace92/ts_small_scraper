import * as path from "node:path"
import * as fs from "fs"
import { ExtractedPageData } from "./crawl.js"


export function writeJSONreport (
    pageData: Record<string, ExtractedPageData>,
    filename: string = "report.json",
) {
    const sorted = Object.values(pageData).sort((a, b) => a.url.localeCompare(b.url))
    const out = JSON.stringify(sorted, null, 2)
    const absPath = path.resolve(process.cwd(), filename)
    fs.writeFileSync(absPath, out)
}