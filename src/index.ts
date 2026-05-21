import { crawlPage, crawlSiteAsync } from "./crawl.js"

async function main(){
    if (!process.argv.slice(2) || process.argv.slice(2).length > 3){
        console.error("Incorrect number of args - a URL, LIMIT, and MAXCONCURRENCY")
        process.exit(1)
    }
    const baseURL = process.argv.slice(2)[0]
    const limit = Number(process.argv.slice(2)[1])
    if (Number.isNaN(limit)){
        console.error("Limit term is not a number - command usage: npm start URL LIMIT MAXCONCURRENCY")
    }
    const maxCon = Number(process.argv.slice(2)[2])
    if (Number.isNaN(maxCon)){
        console.error("Max concurrency is not a number - command usage: npm start URL LIMIT MAXCONCURRENCY")
    }
    console.log(`Crawler starting at: ${baseURL}`)
    let pages: Record<string, number> = {} 
    try{
        pages = await crawlSiteAsync(baseURL, limit, maxCon)
    } catch (err) {
        console.error(err)
    }
    console.log(pages)
    process.exit(0)
}

main()