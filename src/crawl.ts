import { JSDOM } from "jsdom"

export function normalizeURL(url: string): string {
    //here we are going to grab the protocol
    //Side benefit: Also validates that the string is a url - this will error if we feed it a non url string
    let urlObj = new URL(url)
    console.log(urlObj.protocol)
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

