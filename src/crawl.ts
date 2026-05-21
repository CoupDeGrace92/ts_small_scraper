import { JSDOM } from "jsdom"
import { url } from "node:inspector"
import pLimit from "p-limit"

export function normalizeURL(url: string): string {
    //here we are going to grab the protocol
    //Side benefit: Also validates that the string is a url - this will error if we feed it a non url string
    let urlObj = new URL(url)
    let out: string = urlObj.href.replace(urlObj.protocol + "//", "")
    if (out.endsWith("/")) {
        out = out.slice(0,-1)
    }
    return out
}

export function getHeadingFromHTML(html: string): string {
    const domObj = new JSDOM(html)
    const h1 = domObj.window.document.querySelector('h1')
    if (!h1) {
        const h2 = domObj.window.document.querySelector('h2')
        if (!h2) {
            return ""
        }
        return h2.textContent.trim() ?? ""
    }
    return h1.textContent.trim() ?? ""
}

export function getFirstParagraphFromHTML(html: string): string{
    const domObj = new JSDOM(html)
    const main = domObj.window.document.querySelector('main')
    if (!main || !main.querySelector('p')) {
        const p = domObj.window.document.querySelector('p')
        if (!p) {
            return ""
        }
        return p.textContent.trim() ?? ""
    }
    return main.querySelector('p')?.textContent?.trim() ?? ""
}

export function getURLsFromHTML(html: string, baseURL: string): string[]{
    const domObj = new JSDOM(html)
    const urls: string[] = [] 
    const aArray = domObj.window.document.querySelectorAll('a')
    for (let element of aArray){
        let url = element.getAttribute("href")
        if (url) {
            url = new URL(url, baseURL).toString()
            urls.push(url)
        }
    }
    return urls
}

export function getImagesFromHTML(html: string, baseURL: string): string[]{
    const domObj = new JSDOM(html)
    const urls: string[] = []
    const imgArray = domObj.window.document.querySelectorAll('img')
    for (let element of imgArray){
        let url = element.getAttribute("src")
        if (url) {
            url = new URL(url, baseURL).toString()
            urls.push(url)
        }
    }
    return urls
}

export type ExtractedPageData = {
    url: string,
    heading: string,
    firstParagraph: string,
    outgoingLinks: string[],
    imageURLs: string[],
}


export function extractPageData(html: string, pageURL: string): ExtractedPageData{
    const out: ExtractedPageData = {
        url: pageURL,
        heading: getHeadingFromHTML(html),
        firstParagraph: getFirstParagraphFromHTML(html),
        outgoingLinks: getURLsFromHTML(html, pageURL),
        imageURLs: getImagesFromHTML(html, pageURL)
    }
    return out
}

export async function getHTML(url: string): Promise<string> {
    const response = await fetch(url, {
        headers: {
            "User-Agent": "TSSimpleCrawl/1.0"
        }
    })

    if (response.status >= 400) {
        console.error(`Returned error status: ${response.status} ${response.statusText}`)
        return ""
    }
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("text/html") ) {
        console.error(`Response not content-type text/html`)
        return ""
    }
    return await response.text() ?? ""
}

export async function crawlPage(
    baseURL: string, 
    currentURL: string = baseURL, 
    pages: Record<string, number> = {}
): Promise<Record<string, number>> {
    const absolute = new URL(currentURL, baseURL).toString()
    const normalized = normalizeURL(absolute)
    pages[normalized] = (pages[normalized] ?? 0) + 1
    const curURL = new URL(absolute)
    const base = new URL(baseURL)
    if (curURL.hostname !== base.hostname) {
        return pages
    }
    if (pages[normalized] !== 1 ) {
        return pages
    }

    const html = await getHTML(absolute)
    if (!html) {
        return pages
    }
    const infoObj = extractPageData(html, absolute)
    for (let u of infoObj.outgoingLinks) {
        await crawlPage(baseURL, u, pages)
    }
    return pages
}

export class ConcurrentCrawler {
    private baseURL: string
    private pages: Record<string, number>
    private limit: <T>(fn: () => Promise<T>) => Promise<T>
    private maxPages: number
    private shouldStop: boolean
    private allTasks: Set<Promise<void>>

    constructor(baseURL: string, limit: number = 1, maxPages: number = 200, pages: Record<string, number> = {}) {
        this.limit = pLimit(limit)
        this.baseURL = baseURL
        this.pages = {}
        this.maxPages = maxPages
        this.shouldStop = false
        this.allTasks = new Set<Promise<void>>
    }
    private stop() {
        this.shouldStop = true
    }

    private addPageVisit(normalizedURL: string): boolean {
        if (this.shouldStop) {
            return false
        }
        this.pages[normalizedURL] = (this.pages[normalizedURL] ?? 0) + 1
        if (this.pages[normalizedURL] === 1){
            if (Object.entries(this.pages).length >= this.maxPages){
                this.stop()
                console.log("Reached maximum number of pages to crawl")
                return false
            }
            return true
        }
        return false
    }

    private async getHTML(currentURL: string): Promise<string> {
        return await this.limit(async () => {
            const html = await getHTML(currentURL)
            if (!html) {
                throw new Error("No HTML returned")
            }
            return html
        })
    }

    private async crawlPage(currentURL: string): Promise<void> {
        if (this.shouldStop) {
            return
        }
        const curURL = new URL(currentURL, this.baseURL)
        const absolute = curURL.toString()
        const normalized = normalizeURL(absolute)
        const base = new URL(this.baseURL) //we could probably make a performance improvement by making this a class var
        
        if (!this.addPageVisit(normalized)) {
            return
        }
        
        if (curURL.hostname !== base.hostname) {
            return
        }
        let html: string

        try{
            html = await this.getHTML(absolute)
        } catch (err) {
            console.error(err)
            return
        }

        if (!html) {
            return
        }
        const infoObj = extractPageData(html, absolute)
        for (let u of infoObj.outgoingLinks) {
            const task = this.crawlPage(u)
            this.allTasks.add(task)
            task.finally(() => this.allTasks.delete(task))
        }
        return
    }

    async crawl(): Promise<Record<string,number>> {
        await this.crawlPage(this.baseURL)
        while (this.allTasks.size > 0){
            await Promise.all([...this.allTasks])
        }
        return this.pages
    }
}

export async function crawlSiteAsync(baseURL: string, limit: number = 1, maxPages: number = 100): Promise<Record<string, number>> {
    const myCrawler = new ConcurrentCrawler(baseURL, limit, maxPages)
    return await myCrawler.crawl()
}

